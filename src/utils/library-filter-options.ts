import type { Folder, PromptRecipe } from '../types/index';
import type { SearchableMultiSelectOption } from '../components/ui/SearchableMultiSelect';
import { formatFolderLabel } from './folder-label';

/**
 * Sorts filter options for display without mutating the caller's array.
 * Locale comparison is case-insensitive so mixed-case tags/folders group naturally.
 */
function sortFilterOptions<T extends string>(
  options: Array<SearchableMultiSelectOption<T>>,
): Array<SearchableMultiSelectOption<T>> {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, {
    sensitivity: 'base',
  }));
}

/**
 * Builds folder filter options from known folders plus folder ids found on prompts.
 * Fallback labels keep imported or legacy prompt folders selectable even when
 * their Folder record has not been recreated yet.
 */
export function deriveFolderFilterOptions(
  prompts: PromptRecipe[],
  folders: Folder[] = [],
): Array<SearchableMultiSelectOption<string>> {
  const optionMap = new Map<string, SearchableMultiSelectOption<string>>();

  for (const folder of folders) {
    optionMap.set(folder.id, { label: folder.name, value: folder.id });
  }

  for (const prompt of prompts) {
    if (prompt.folderId && !optionMap.has(prompt.folderId)) {
      optionMap.set(prompt.folderId, {
        label: formatFolderLabel(prompt.folderId),
        value: prompt.folderId,
      });
    }
  }

  return sortFilterOptions(Array.from(optionMap.values()));
}

/**
 * Builds tag filter options from prompt tags, dropping empty labels and preserving
 * first-seen casing for display.
 */
export function deriveTagFilterOptions(prompts: PromptRecipe[]): Array<SearchableMultiSelectOption<string>> {
  const optionMap = new Map<string, SearchableMultiSelectOption<string>>();

  for (const prompt of prompts) {
    for (const tag of prompt.tags) {
      const normalizedTag = tag.trim();
      if (normalizedTag !== '' && !optionMap.has(normalizedTag)) {
        optionMap.set(normalizedTag, {
          label: normalizedTag,
          value: normalizedTag,
        });
      }
    }
  }

  return sortFilterOptions(Array.from(optionMap.values()));
}
