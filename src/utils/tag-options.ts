const DEFAULT_QUICK_TAG_LIMIT = 6;

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

interface QuickTagOptionsInput {
  availableTags?: string[];
  selectedTags: string[];
  query: string;
  limit?: number;
}

export function getQuickTagOptions({
  availableTags = [],
  selectedTags,
  query,
  limit = DEFAULT_QUICK_TAG_LIMIT,
}: QuickTagOptionsInput): string[] {
  const normalizedQuery = normalizeTag(query);
  const selectedTagKeys = new Set(selectedTags.map(normalizeTag));
  const seen = new Set<string>();

  return availableTags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')
    .filter((tag) => {
      const key = normalizeTag(tag);
      if (selectedTagKeys.has(key) || seen.has(key)) return false;
      seen.add(key);
      return normalizedQuery === '' || key.includes(normalizedQuery);
    })
    .slice(0, limit);
}

export function resolveExistingTagName(availableTags: string[], value: string): string {
  const trimmed = value.trim();
  const normalized = normalizeTag(trimmed);

  return availableTags.find((candidate) => normalizeTag(candidate) === normalized)?.trim()
    ?? trimmed;
}
