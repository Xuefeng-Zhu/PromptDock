import type { PromptRecipe } from '../types/index';
import { SearchEngine } from '../services/search-engine';
import {
  applyPromptFilters,
  hasArchivedPromptFilter,
  isRecentPrompt,
  type FilterType,
} from './prompt-filters';

const TOP_LEVEL_SIDEBAR_ITEMS = new Set([
  'library',
  'favorites',
  'recent',
  'archived',
  'tags',
  'workspaces',
]);
const librarySearchEngine = new SearchEngine();

/**
 * Filtering pipeline:
 * 1. Apply sidebar library/folder/tag filter
 * 2. Exclude archived prompts unless the archived sidebar item is selected
 * 3. Apply search query against title, description, and tags
 * 4. Apply attribute filters from the Filters menu
 */
export function filterPrompts(
  prompts: PromptRecipe[],
  searchQuery: string,
  activeFilter: FilterType,
  activeSidebarItem: string,
): PromptRecipe[] {
  const showingArchived = activeSidebarItem === 'archived' || hasArchivedPromptFilter(activeFilter);
  let result = prompts.filter((prompt) => prompt.archived === showingArchived);

  if (activeSidebarItem === 'favorites') {
    result = result.filter((prompt) => prompt.favorite === true);
  } else if (activeSidebarItem === 'recent') {
    result = result.filter((prompt) => isRecentPrompt(prompt));
  } else if (activeSidebarItem.startsWith('tag-')) {
    const selectedTag = activeSidebarItem.slice(4);
    result = result.filter((prompt) =>
      prompt.tags.some((tag) => tag.toLowerCase() === selectedTag),
    );
  } else if (!TOP_LEVEL_SIDEBAR_ITEMS.has(activeSidebarItem)) {
    result = result.filter((prompt) => prompt.folderId === activeSidebarItem);
  }

  if (searchQuery.trim() !== '') {
    result = librarySearchEngine.search(result, searchQuery, {
      includeArchived: showingArchived,
      fields: ['title', 'tags', 'description'],
    });
  }

  return applyPromptFilters(result, activeFilter);
}
