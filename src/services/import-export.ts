import type {
  PromptRecipe,
  ImportResult,
  DuplicateInfo,
  PromptVariable,
} from '../types/index';
import type { IImportExportService } from './interfaces';
import {
  isPromptVariableInputType,
  normalizePromptVariableOptions,
  resolvePromptVariables,
} from '../utils/prompt-variables';

/**
 * Schema version for the export JSON format.
 */
const EXPORT_SCHEMA_VERSION = '1.0';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Shape of the export JSON document.
 */
interface ExportDocument {
  version: string;
  exportedAt: string;
  prompts: ExportedPrompt[];
}

/**
 * Subset of PromptRecipe fields included in the export.
 * Required: title, body. Optional: description, tags, folderId, favorite, createdAt, updatedAt.
 */
interface ExportedPrompt {
  title: string;
  body: string;
  variables?: PromptVariable[];
  description?: string;
  tags?: string[];
  folderId?: string | null;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for importing and exporting PromptRecipe collections as JSON.
 *
 * - Export serializes non-archived prompts with schema version "1.0" and an ISO timestamp.
 * - Import validates JSON structure against the export schema before returning parsed prompts.
 * - Duplicate detection compares incoming prompts against existing ones by title and body.
 */
export class ImportExportService implements IImportExportService {
  /**
   * Serialize non-archived prompts to a JSON string conforming to the export schema.
   * Archived prompts are excluded from the output.
   */
  exportToJSON(prompts: PromptRecipe[]): string {
    const nonArchived = prompts.filter((p) => !p.archived);

    const exportDoc: ExportDocument = {
      version: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      prompts: nonArchived.map((p) => this.toExportedPrompt(p)),
    };

    return JSON.stringify(exportDoc, null, 2);
  }

  /**
   * Parse and validate a JSON string against the export schema.
   * Returns an ImportResult with parsed PromptRecipe objects on success,
   * or a list of validation errors on failure.
   */
  importFromJSON(json: string): ImportResult {
    // Step 1: Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { success: false, errors: ['Invalid JSON: unable to parse input'] };
    }

    // Step 2: Validate top-level structure
    const errors: string[] = [];

    if (!isRecord(parsed)) {
      return { success: false, errors: ['Invalid format: expected a JSON object'] };
    }

    const doc = parsed;

    if (!('version' in doc) || typeof doc.version !== 'string') {
      errors.push('Missing or invalid field: "version" must be a string');
    } else if (doc.version !== EXPORT_SCHEMA_VERSION) {
      errors.push(`Unsupported export version: expected "${EXPORT_SCHEMA_VERSION}"`);
    }

    if (!('exportedAt' in doc) || typeof doc.exportedAt !== 'string') {
      errors.push('Missing or invalid field: "exportedAt" must be a string');
    } else if (!isValidDateString(doc.exportedAt)) {
      errors.push('Invalid field: "exportedAt" must be a valid date string');
    }

    if (!('prompts' in doc) || !Array.isArray(doc.prompts)) {
      errors.push('Missing or invalid field: "prompts" must be an array');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Step 3: Validate each prompt in the array
    const promptsArray = doc.prompts as unknown[];
    const validatedPrompts: PromptRecipe[] = [];

    for (let i = 0; i < promptsArray.length; i++) {
      const item = promptsArray[i];

      if (!isRecord(item)) {
        errors.push(`Prompt at index ${i}: expected an object`);
        continue;
      }

      const prompt = item;
      const promptErrors: string[] = [];

      if (typeof prompt.title !== 'string' || prompt.title.trim().length === 0) {
        promptErrors.push(`Prompt at index ${i}: missing or invalid required field "title"`);
      }

      if (typeof prompt.body !== 'string' || prompt.body.trim().length === 0) {
        promptErrors.push(`Prompt at index ${i}: missing or invalid required field "body"`);
      }

      if ('description' in prompt && typeof prompt.description !== 'string') {
        promptErrors.push(`Prompt at index ${i}: optional field "description" must be a string`);
      }

      if ('tags' in prompt && !isStringArray(prompt.tags)) {
        promptErrors.push(`Prompt at index ${i}: optional field "tags" must be an array of strings`);
      }

      if ('variables' in prompt) {
        validatePromptVariables(prompt.variables, i, promptErrors);
      }

      if (
        'folderId' in prompt
        && prompt.folderId !== null
        && typeof prompt.folderId !== 'string'
      ) {
        promptErrors.push(`Prompt at index ${i}: optional field "folderId" must be a string or null`);
      }

      if ('favorite' in prompt && typeof prompt.favorite !== 'boolean') {
        promptErrors.push(`Prompt at index ${i}: optional field "favorite" must be a boolean`);
      }

      if ('createdAt' in prompt && !isValidDateString(prompt.createdAt)) {
        promptErrors.push(`Prompt at index ${i}: optional field "createdAt" must be a valid date string`);
      }

      if ('updatedAt' in prompt && !isValidDateString(prompt.updatedAt)) {
        promptErrors.push(`Prompt at index ${i}: optional field "updatedAt" must be a valid date string`);
      }

      errors.push(...promptErrors);

      if (promptErrors.length === 0) {
        validatedPrompts.push(this.toPromptRecipe(prompt));
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, prompts: validatedPrompts };
  }

  /**
   * Compare incoming prompts against existing prompts by title and body.
   * Returns a DuplicateInfo entry for each incoming prompt that matches
   * an existing prompt on title, body, or both.
   */
  detectDuplicates(incoming: PromptRecipe[], existing: PromptRecipe[]): DuplicateInfo[] {
    const duplicates: DuplicateInfo[] = [];

    for (const inc of incoming) {
      for (const ext of existing) {
        const titleMatch = inc.title === ext.title;
        const bodyMatch = inc.body === ext.body;

        if (titleMatch && bodyMatch) {
          duplicates.push({ incoming: inc, existing: ext, matchedOn: 'both' });
        } else if (titleMatch) {
          duplicates.push({ incoming: inc, existing: ext, matchedOn: 'title' });
        } else if (bodyMatch) {
          duplicates.push({ incoming: inc, existing: ext, matchedOn: 'body' });
        }
      }
    }

    return duplicates;
  }

  /**
   * Convert a PromptRecipe to the exported prompt shape.
   */
  private toExportedPrompt(recipe: PromptRecipe): ExportedPrompt {
    const exported: ExportedPrompt = {
      title: recipe.title,
      body: recipe.body,
    };

    if (recipe.description) {
      exported.description = recipe.description;
    }
    if (recipe.tags && recipe.tags.length > 0) {
      exported.tags = recipe.tags;
    }
    if (recipe.variables && recipe.variables.length > 0) {
      const variables = resolvePromptVariables(recipe.body, recipe.variables);
      if (variables.length > 0) {
        exported.variables = variables;
      }
    }
    if (recipe.folderId !== null) {
      exported.folderId = recipe.folderId;
    }
    if (recipe.favorite) {
      exported.favorite = recipe.favorite;
    }
    if (recipe.createdAt) {
      exported.createdAt = recipe.createdAt instanceof Date
        ? recipe.createdAt.toISOString()
        : String(recipe.createdAt);
    }
    if (recipe.updatedAt) {
      exported.updatedAt = recipe.updatedAt instanceof Date
        ? recipe.updatedAt.toISOString()
        : String(recipe.updatedAt);
    }

    return exported;
  }

  /**
   * Convert a parsed prompt object from the import JSON into a full PromptRecipe.
   * Generates a new id and fills in defaults for optional fields.
   */
  private toPromptRecipe(data: Record<string, unknown>): PromptRecipe {
    const now = new Date();
    const variables = Array.isArray(data.variables)
      ? resolvePromptVariables(data.body as string, data.variables as PromptVariable[])
      : undefined;

    return {
      id: crypto.randomUUID(),
      workspaceId: '',
      title: (data.title as string).trim(),
      description: typeof data.description === 'string' ? data.description : '',
      body: data.body as string,
      ...(variables && variables.length > 0 ? { variables } : {}),
      tags: isStringArray(data.tags) ? data.tags : [],
      folderId: typeof data.folderId === 'string' ? data.folderId : null,
      favorite: typeof data.favorite === 'boolean' ? data.favorite : false,
      archived: false,
      archivedAt: null,
      createdAt: isValidDateString(data.createdAt) ? new Date(data.createdAt) : now,
      updatedAt: isValidDateString(data.updatedAt) ? new Date(data.updatedAt) : now,
      lastUsedAt: null,
      createdBy: 'local',
      version: 1,
    };
  }
}

function validatePromptVariables(
  value: unknown,
  promptIndex: number,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    errors.push(`Prompt at index ${promptIndex}: optional field "variables" must be an array`);
    return;
  }

  value.forEach((item, variableIndex) => {
    const prefix = `Prompt at index ${promptIndex}, variable at index ${variableIndex}`;

    if (!isRecord(item)) {
      errors.push(`${prefix}: expected an object`);
      return;
    }

    if (typeof item.name !== 'string' || item.name.trim().length === 0) {
      errors.push(`${prefix}: missing or invalid required field "name"`);
    }

    if ('defaultValue' in item && typeof item.defaultValue !== 'string') {
      errors.push(`${prefix}: optional field "defaultValue" must be a string`);
    }

    if ('description' in item && typeof item.description !== 'string') {
      errors.push(`${prefix}: optional field "description" must be a string`);
    }

    if ('inputType' in item && !isPromptVariableInputType(item.inputType)) {
      errors.push(`${prefix}: optional field "inputType" must be text, textarea, or dropdown`);
    }

    if ('options' in item && !isStringArray(item.options)) {
      errors.push(`${prefix}: optional field "options" must be an array of strings`);
    }

    const options = normalizePromptVariableOptions(item.options);

    if (
      item.inputType === 'dropdown'
      && options.length === 0
    ) {
      errors.push(`${prefix}: dropdown variables require at least one option`);
    }

    if (
      item.inputType === 'dropdown'
      && typeof item.defaultValue === 'string'
      && item.defaultValue.length > 0
      && !options.includes(item.defaultValue)
    ) {
      errors.push(`${prefix}: dropdown defaultValue must match one of its options`);
    }
  });
}
