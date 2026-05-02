import type { PromptRecipe } from '../types/index';

export type SortFilter = 'lastUsed' | 'updated' | 'created' | 'az';
export type StatusFilter = 'favorites' | 'recent' | 'archived' | 'hasVariables';
export type FolderFilter = 'work' | 'writing' | 'product' | 'engineering' | 'personal';
export type TagFilter = 'writing' | 'summarization' | 'email' | 'code' | 'meeting' | 'ideation';
export type LastUsedFilter = 'any' | 'today' | 'last7Days' | 'last30Days';

export interface PromptFilters {
  sortBy: SortFilter;
  query: string;
  statuses: StatusFilter[];
  folders: FolderFilter[];
  tags: TagFilter[];
  lastUsed: LastUsedFilter;
}

export type FilterType = 'all' | 'favorites' | 'recent' | PromptFilters;

export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function createDefaultPromptFilters(): PromptFilters {
  return {
    sortBy: 'lastUsed',
    query: '',
    statuses: [],
    folders: [],
    tags: [],
    lastUsed: 'any',
  };
}

export function normalizePromptFilters(filter: FilterType): PromptFilters {
  if (filter === 'all') {
    return createDefaultPromptFilters();
  }

  if (filter === 'favorites') {
    return {
      ...createDefaultPromptFilters(),
      statuses: ['favorites'],
    };
  }

  if (filter === 'recent') {
    return {
      ...createDefaultPromptFilters(),
      statuses: ['recent'],
    };
  }

  return {
    ...createDefaultPromptFilters(),
    ...filter,
    statuses: filter.statuses ?? [],
    folders: filter.folders ?? [],
    tags: filter.tags ?? [],
  };
}

export function countActivePromptFilters(filter: FilterType): number {
  const normalized = normalizePromptFilters(filter);

  return (
    Number(normalized.query.trim() !== '') +
    normalized.statuses.length +
    normalized.folders.length +
    normalized.tags.length +
    Number(normalized.lastUsed !== 'any')
  );
}

export function hasArchivedPromptFilter(filter: FilterType): boolean {
  return normalizePromptFilters(filter).statuses.includes('archived');
}

export function isRecentPrompt(prompt: PromptRecipe, referenceDate: Date = new Date()): boolean {
  if (!prompt.lastUsedAt) return false;
  return prompt.lastUsedAt.getTime() > referenceDate.getTime() - RECENT_WINDOW_MS;
}

export function hasPromptVariables(prompt: PromptRecipe): boolean {
  return /{{\s*[\w.-]+\s*}}/.test(prompt.body);
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/^folder-/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function matchesFolder(prompt: PromptRecipe, folders: FolderFilter[]): boolean {
  if (!prompt.folderId) return false;
  const folderKey = normalizeToken(prompt.folderId);
  return folders.some((folder) => folderKey === normalizeToken(folder));
}

function matchesTag(prompt: PromptRecipe, tags: TagFilter[]): boolean {
  const promptTags = prompt.tags.map(normalizeToken);
  return tags.some((tag) => {
    const tagKey = normalizeToken(tag);
    return promptTags.some((promptTag) => {
      if (promptTag === tagKey) return true;
      return promptTag.endsWith('s') && promptTag.slice(0, -1) === tagKey;
    });
  });
}

function matchesQuery(prompt: PromptRecipe, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === '') return true;

  return (
    prompt.title.toLowerCase().includes(normalizedQuery) ||
    prompt.description.toLowerCase().includes(normalizedQuery) ||
    prompt.body.toLowerCase().includes(normalizedQuery) ||
    prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function matchesLastUsedRange(
  prompt: PromptRecipe,
  range: LastUsedFilter,
  referenceDate: Date,
): boolean {
  if (range === 'any') return true;
  if (!prompt.lastUsedAt) return false;

  const lastUsedTime = prompt.lastUsedAt.getTime();
  const referenceTime = referenceDate.getTime();

  if (range === 'today') {
    return isSameLocalDay(prompt.lastUsedAt, referenceDate);
  }

  if (range === 'last7Days') {
    return lastUsedTime > referenceTime - RECENT_WINDOW_MS;
  }

  return lastUsedTime > referenceTime - THIRTY_DAYS_MS;
}

export function sortPromptsByFilter(prompts: PromptRecipe[], sortBy: SortFilter): PromptRecipe[] {
  return [...prompts].sort((a, b) => {
    if (sortBy === 'az') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }

    if (sortBy === 'created') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }

    if (sortBy === 'updated') {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }

    const lastUsedDiff = (b.lastUsedAt?.getTime() ?? 0) - (a.lastUsedAt?.getTime() ?? 0);
    if (lastUsedDiff !== 0) return lastUsedDiff;

    const updatedDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (updatedDiff !== 0) return updatedDiff;

    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

export function applyPromptFilters(
  prompts: PromptRecipe[],
  filter: FilterType,
  referenceDate: Date = new Date(),
): PromptRecipe[] {
  const normalized = normalizePromptFilters(filter);
  let result = prompts;

  if (normalized.query.trim() !== '') {
    result = result.filter((prompt) => matchesQuery(prompt, normalized.query));
  }

  if (normalized.statuses.includes('favorites')) {
    result = result.filter((prompt) => prompt.favorite);
  }

  if (normalized.statuses.includes('recent')) {
    result = result.filter((prompt) => isRecentPrompt(prompt, referenceDate));
  }

  if (normalized.statuses.includes('archived')) {
    result = result.filter((prompt) => prompt.archived);
  }

  if (normalized.statuses.includes('hasVariables')) {
    result = result.filter(hasPromptVariables);
  }

  if (normalized.folders.length > 0) {
    result = result.filter((prompt) => matchesFolder(prompt, normalized.folders));
  }

  if (normalized.tags.length > 0) {
    result = result.filter((prompt) => matchesTag(prompt, normalized.tags));
  }

  if (normalized.lastUsed !== 'any') {
    result = result.filter((prompt) =>
      matchesLastUsedRange(prompt, normalized.lastUsed, referenceDate),
    );
  }

  return sortPromptsByFilter(result, normalized.sortBy);
}
