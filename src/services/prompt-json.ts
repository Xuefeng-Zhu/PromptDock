import type { Folder, PromptRecipe } from '../types/index';

export type PromptJsonDraft = Pick<
  PromptRecipe,
  'title' | 'description' | 'body' | 'tags' | 'folderId' | 'favorite'
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
      tags,
      folderId,
      favorite: favorite ?? false,
    },
  };
}
