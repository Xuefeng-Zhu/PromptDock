import type { Folder, PromptRecipe, PromptVariable } from '../types/index';
import {
  isPromptVariableInputType,
  normalizePromptVariableOptions,
  resolvePromptVariables,
} from '../utils/prompt-variables';

export type PromptJsonDraft = Pick<
  PromptRecipe,
  'title' | 'description' | 'body' | 'variables' | 'tags' | 'folderId' | 'favorite'
>;

export type PromptJsonParseResult =
  | { success: true; data: PromptJsonDraft }
  | { success: false; errors: string[] };

interface ParsePromptJsonOptions {
  folders?: Folder[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves an imported folder reference to an existing folder id.
 * Imports may use either a display name or id, but unknown folders are rejected
 * so the editor never creates hidden or misspelled folder assignments.
 */
function resolveFolderId(
  value: unknown,
  folders: Folder[],
  fieldName: 'folder' | 'folderId',
): { folderId: string | null; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { folderId: null };
  }

  if (typeof value !== 'string') {
    return { folderId: null, error: `${fieldName} must be a string or null.` };
  }

  const trimmed = value.trim();
  if (!trimmed) return { folderId: null };

  const normalized = trimmed.toLowerCase();
  const matchedFolder = folders.find(
    (folder) =>
      folder.id.toLowerCase() === normalized ||
      folder.name.toLowerCase() === normalized,
  );

  if (!matchedFolder) {
    return {
      folderId: null,
      error: `${fieldName} must match an existing folder name or id.`,
    };
  }

  return { folderId: matchedFolder.id };
}

/**
 * Parses imported tags into trimmed, case-insensitively deduped labels.
 * The first spelling wins so user casing is preserved in the editor draft.
 */
function parseTags(value: unknown): { tags: string[]; error?: string } {
  if (value === undefined) return { tags: [] };

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return { tags: [], error: 'tags must be an array of strings.' };
  }

  const tagsByKey = new Map<string, string>();

  for (const item of value) {
    const tag = item.trim();
    const key = tag.toLowerCase();
    if (tag && !tagsByKey.has(key)) {
      tagsByKey.set(key, tag);
    }
  }

  return { tags: Array.from(tagsByKey.values()) };
}

function parseVariables(
  value: unknown,
  body: string,
): { variables?: PromptVariable[]; errors: string[] } {
  if (value === undefined) return { errors: [] };

  if (!Array.isArray(value)) {
    return { errors: ['variables must be an array.'] };
  }

  const errors: string[] = [];

  value.forEach((item, index) => {
    const prefix = `variables[${index}]`;

    if (!isRecord(item)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    if (typeof item.name !== 'string' || item.name.trim().length === 0) {
      errors.push(`${prefix}.name is required and must be a non-empty string.`);
    }

    if ('defaultValue' in item && typeof item.defaultValue !== 'string') {
      errors.push(`${prefix}.defaultValue must be a string.`);
    }

    if ('description' in item && typeof item.description !== 'string') {
      errors.push(`${prefix}.description must be a string.`);
    }

    if ('inputType' in item && !isPromptVariableInputType(item.inputType)) {
      errors.push(`${prefix}.inputType must be text, textarea, or dropdown.`);
    }

    if ('options' in item && !Array.isArray(item.options)) {
      errors.push(`${prefix}.options must be an array of strings.`);
    } else if (
      Array.isArray(item.options)
      && item.options.some((option) => typeof option !== 'string')
    ) {
      errors.push(`${prefix}.options must be an array of strings.`);
    }

    const options = normalizePromptVariableOptions(item.options);

    if (item.inputType === 'dropdown' && options.length === 0) {
      errors.push(`${prefix}.options must include at least one value for dropdown variables.`);
    }

    if (
      item.inputType === 'dropdown'
      && typeof item.defaultValue === 'string'
      && item.defaultValue.length > 0
      && !options.includes(item.defaultValue)
    ) {
      errors.push(`${prefix}.defaultValue must match one of the dropdown options.`);
    }
  });

  if (errors.length > 0) return { errors };

  const variables = resolvePromptVariables(body, value);
  return {
    errors: [],
    ...(variables.length > 0 ? { variables } : {}),
  };
}

/**
 * Parses a user-supplied prompt JSON snippet into an editor-ready draft.
 * Validates required fields and variable metadata, dedupes tags, resolves
 * folder/folderId against known folders, and returns accumulated errors
 * without throwing for bad input.
 */
export function parsePromptJson(
  json: string,
  { folders = [] }: ParsePromptJsonOptions = {},
): PromptJsonParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, errors: ['Invalid JSON: unable to parse input.'] };
  }

  if (!isRecord(parsed)) {
    return { success: false, errors: ['JSON must be an object.'] };
  }

  const errors: string[] = [];

  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  if (!title) {
    errors.push('title is required and must be a non-empty string.');
  }

  const body = typeof parsed.body === 'string' ? parsed.body : '';
  if (typeof parsed.body !== 'string' || !parsed.body.trim()) {
    errors.push('body is required and must be a non-empty string.');
  }

  const description =
    parsed.description === undefined
      ? ''
      : typeof parsed.description === 'string'
        ? parsed.description.trim()
        : null;
  if (description === null) {
    errors.push('description must be a string.');
  }

  const { tags, error: tagsError } = parseTags(parsed.tags);
  if (tagsError) errors.push(tagsError);

  const { variables, errors: variableErrors } = parseVariables(parsed.variables, body);
  errors.push(...variableErrors);

  if (parsed.folder !== undefined && parsed.folderId !== undefined) {
    errors.push('Use either folder or folderId, not both.');
  }

  const folderValue = parsed.folder !== undefined ? parsed.folder : parsed.folderId;
  const folderFieldName = parsed.folder !== undefined ? 'folder' : 'folderId';
  const { folderId, error: folderError } = resolveFolderId(
    folderValue,
    folders,
    folderFieldName,
  );
  if (folderError) errors.push(folderError);

  const favorite =
    parsed.favorite === undefined
      ? false
      : typeof parsed.favorite === 'boolean'
        ? parsed.favorite
        : null;
  if (favorite === null) {
    errors.push('favorite must be a boolean.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      description: description ?? '',
      body,
      ...(variables && variables.length > 0 ? { variables } : {}),
      tags,
      folderId,
      favorite: favorite ?? false,
    },
  };
}
