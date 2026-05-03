import type {
  FolderFilter,
  LastUsedFilter,
  PromptFilters,
  StatusFilter,
  TagFilter,
} from './prompt-filters';

export const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Favorites only', value: 'favorites' },
  { label: 'Recent', value: 'recent' },
  { label: 'Archived', value: 'archived' },
  { label: 'Has variables', value: 'hasVariables' },
];

export const LAST_USED_OPTIONS: Array<{ label: string; value: LastUsedFilter }> = [
  { label: 'Any time', value: 'any' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'last7Days' },
  { label: 'Last 30 days', value: 'last30Days' },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option.label])) as Record<StatusFilter, string>;
const LAST_USED_LABELS = Object.fromEntries(LAST_USED_OPTIONS.map((option) => [option.value, option.label])) as Record<LastUsedFilter, string>;

export type ActiveFilterChip =
  | { id: string; label: string; kind: 'query' }
  | { id: string; label: string; kind: 'status'; value: StatusFilter }
  | { id: string; label: string; kind: 'folder'; value: FolderFilter }
  | { id: string; label: string; kind: 'tag'; value: TagFilter }
  | { id: string; label: string; kind: 'lastUsed' };

export function toggleFilterValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function fallbackFilterLabel(value: string): string {
  const cleaned = value
    .replace(/^folder-/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  if (cleaned === '') return value;

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getActiveFilterChips(
  filters: PromptFilters,
  folderLabels: Record<string, string>,
  tagLabels: Record<string, string>,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.query.trim() !== '') {
    chips.push({
      id: 'query',
      label: `Search: ${filters.query.trim()}`,
      kind: 'query',
    });
  }

  for (const status of filters.statuses) {
    chips.push({
      id: `status-${status}`,
      label: `Status: ${STATUS_LABELS[status]}`,
      kind: 'status',
      value: status,
    });
  }

  for (const folder of filters.folders) {
    chips.push({
      id: `folder-${folder}`,
      label: `Folder: ${folderLabels[folder] ?? fallbackFilterLabel(folder)}`,
      kind: 'folder',
      value: folder,
    });
  }

  for (const tag of filters.tags) {
    chips.push({
      id: `tag-${tag}`,
      label: `#${(tagLabels[tag] ?? tag).toLowerCase()}`,
      kind: 'tag',
      value: tag,
    });
  }

  if (filters.lastUsed !== 'any') {
    chips.push({
      id: 'last-used',
      label: `Last used: ${LAST_USED_LABELS[filters.lastUsed]}`,
      kind: 'lastUsed',
    });
  }

  return chips;
}

export function removeFilterChipFromFilters(
  filters: PromptFilters,
  chip: ActiveFilterChip,
): PromptFilters {
  if (chip.kind === 'query') {
    return { ...filters, query: '' };
  }

  if (chip.kind === 'lastUsed') {
    return { ...filters, lastUsed: 'any' };
  }

  if (chip.kind === 'status') {
    return {
      ...filters,
      statuses: filters.statuses.filter((status) => status !== chip.value),
    };
  }

  if (chip.kind === 'folder') {
    return {
      ...filters,
      folders: filters.folders.filter((folder) => folder !== chip.value),
    };
  }

  return {
    ...filters,
    tags: filters.tags.filter((tag) => tag !== chip.value),
  };
}
