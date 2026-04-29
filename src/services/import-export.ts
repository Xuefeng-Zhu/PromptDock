import type { PromptRecipe, ImportResult, DuplicateInfo } from '../types/index';
import type { IImportExportService } from './interfaces';

/**
 * Schema version for the export JSON format.
 */
const EXPORT_SCHEMA_VERSION = '1.0';

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

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { success: false, errors: ['Invalid format: expected a JSON object'] };
    }

    const doc = parsed as Record<string, unknown>;

    if (!('version' in doc) || typeof doc.version !== 'string') {
      errors.push('Missing or invalid field: "version" must be a string');
    }

    if (!('exportedAt' in doc) || typeof doc.exportedAt !== 'string') {
      errors.push('Missing or invalid field: "exportedAt" must be a string');
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

      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        errors.push(`Prompt at index ${i}: expected an object`);
        continue;
      }

      const prompt = item as Record<string, unknown>;

      if (typeof prompt.title !== 'string' || prompt.title.length === 0) {
        errors.push(`Prompt at index ${i}: missing or invalid required field "title"`);
      }

      if (typeof prompt.body !== 'string') {
        errors.push(`Prompt at index ${i}: missing or invalid required field "body"`);
      }

      if (errors.length === 0) {
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

    return {
      id: crypto.randomUUID(),
      workspaceId: '',
      title: data.title as string,
      description: typeof data.description === 'string' ? data.description : '',
      body: data.body as string,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      folderId: typeof data.folderId === 'string' ? data.folderId : null,
      favorite: typeof data.favorite === 'boolean' ? data.favorite : false,
      archived: false,
      archivedAt: null,
      createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : now,
      updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : now,
      lastUsedAt: null,
      createdBy: 'local',
      version: 1,
    };
  }
}
