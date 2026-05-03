import { useMemo } from 'react';
import { CATEGORY_COLORS, PROMPT_CATEGORY_MAP } from '../data/mock-data';
import type { Folder, PromptRecipe } from '../types/index';
import { computeFilterCounts, computeTagCounts } from '../utils/sidebar-counts';
import { extractVariables } from '../utils/prompt-template';
import { filterPrompts } from '../utils/library-filtering';
import { deriveTagFilterOptions } from '../utils/library-filter-options';
import type { FilterType } from '../utils/prompt-filters';

interface UseLibraryDataOptions {
  activeFilter: FilterType;
  activeSidebarItem: string;
  prompts: PromptRecipe[];
  searchQuery: string;
  selectedPromptId: string | null;
  userFolders: Folder[];
  variableFillPromptId: string | null;
}

function deriveFolders(prompts: PromptRecipe[], userFolders: Folder[]): Folder[] {
  const folderMap = new Map<string, Folder>();

  for (const folder of userFolders) {
    folderMap.set(folder.id, folder);
  }

  for (const prompt of prompts) {
    if (prompt.folderId && !folderMap.has(prompt.folderId)) {
      folderMap.set(prompt.folderId, {
        id: prompt.folderId,
        name: prompt.folderId.replace('folder-', '').replace(/^\w/, (character) => character.toUpperCase()),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return Array.from(folderMap.values()).map((folder) => ({
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  }));
}

function countPromptsByFolder(prompts: PromptRecipe[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const prompt of prompts) {
    if (prompt.folderId && !prompt.archived) {
      counts[prompt.folderId] = (counts[prompt.folderId] ?? 0) + 1;
    }
  }
  return counts;
}

function createCategoryColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [promptId, categoryKey] of Object.entries(PROMPT_CATEGORY_MAP)) {
    const colors = CATEGORY_COLORS[categoryKey];
    if (colors) {
      map[promptId] = `${colors.bg} ${colors.text}`;
    }
  }
  return map;
}

export function useLibraryData({
  activeFilter,
  activeSidebarItem,
  prompts,
  searchQuery,
  selectedPromptId,
  userFolders,
  variableFillPromptId,
}: UseLibraryDataOptions) {
  const derivedFolders = useMemo(
    () => deriveFolders(prompts, userFolders),
    [prompts, userFolders],
  );

  const filteredPrompts = useMemo(
    () => filterPrompts(prompts, searchQuery, activeFilter, activeSidebarItem),
    [activeFilter, activeSidebarItem, prompts, searchQuery],
  );

  const promptCountByFolder = useMemo(
    () => countPromptsByFolder(prompts),
    [prompts],
  );

  const sidebarFilterCounts = useMemo(
    () => computeFilterCounts(prompts),
    [prompts],
  );

  const sidebarTagCounts = useMemo(
    () => computeTagCounts(prompts),
    [prompts],
  );

  const availableTags = useMemo(
    () => deriveTagFilterOptions(prompts).map((option) => option.value),
    [prompts],
  );

  const categoryColorMap = useMemo(createCategoryColorMap, []);

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  const selectedPromptFolder = useMemo(
    () =>
      selectedPrompt?.folderId
        ? derivedFolders.find((folder) => folder.id === selectedPrompt.folderId)
        : undefined,
    [derivedFolders, selectedPrompt],
  );

  const selectedPromptVariables = useMemo(
    () => (selectedPrompt ? extractVariables(selectedPrompt.body) : []),
    [selectedPrompt],
  );

  const variableFillPrompt = useMemo(
    () =>
      variableFillPromptId
        ? prompts.find((prompt) => prompt.id === variableFillPromptId) ?? null
        : null,
    [prompts, variableFillPromptId],
  );

  const variableFillVariables = useMemo(
    () => (variableFillPrompt ? extractVariables(variableFillPrompt.body) : []),
    [variableFillPrompt],
  );

  return {
    availableTags,
    categoryColorMap,
    derivedFolders,
    filteredPrompts,
    promptCountByFolder,
    selectedPrompt,
    selectedPromptFolder,
    selectedPromptVariables,
    sidebarFilterCounts,
    sidebarTagCounts,
    variableFillPrompt,
    variableFillVariables,
  };
}
