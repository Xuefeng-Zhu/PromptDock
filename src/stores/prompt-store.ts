import { create } from 'zustand';
import type { PromptRecipe } from '../types';
import { PromptRepository } from '../repositories/prompt-repository';
import { SearchEngine } from '../services/search-engine';

const repo = new PromptRepository();
const searchEngine = new SearchEngine();

interface PromptStore {
  prompts: PromptRecipe[];
  activeWorkspaceId: string;
  selectedPromptId: string | null;
  searchQuery: string;
  folderFilter: string | null;
  favoriteFilter: boolean;
  filteredPrompts: () => PromptRecipe[];
  loadPrompts: () => Promise<void>;
  createPrompt: (data: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePrompt: (id: string, changes: Partial<PromptRecipe>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  archivePrompt: (id: string) => Promise<void>;
  restorePrompt: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFolderFilter: (folderId: string | null) => void;
  setFavoriteFilter: (enabled: boolean) => void;
  setSelectedPromptId: (id: string | null) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  activeWorkspaceId: 'local',
  selectedPromptId: null,
  searchQuery: '',
  folderFilter: null,
  favoriteFilter: false,

  filteredPrompts: () => {
    const { prompts, searchQuery, folderFilter, favoriteFilter } = get();
    let results = searchEngine.search(prompts, searchQuery);
    if (folderFilter) results = results.filter((p) => p.folderId === folderFilter);
    if (favoriteFilter) results = results.filter((p) => p.favorite);
    return results;
  },

  loadPrompts: async () => {
    const prompts = await repo.getAll(get().activeWorkspaceId);
    set({ prompts });
  },

  createPrompt: async (data) => {
    await repo.create(data);
    await get().loadPrompts();
  },

  updatePrompt: async (id, changes) => {
    await repo.update(id, changes);
    await get().loadPrompts();
  },

  deletePrompt: async (id) => {
    await repo.softDelete(id);
    await get().loadPrompts();
  },

  duplicatePrompt: async (id) => {
    await repo.duplicate(id);
    await get().loadPrompts();
  },

  toggleFavorite: async (id) => {
    await repo.toggleFavorite(id);
    await get().loadPrompts();
  },

  archivePrompt: async (id) => {
    await repo.softDelete(id);
    await get().loadPrompts();
  },

  restorePrompt: async (id) => {
    await repo.restore(id);
    await get().loadPrompts();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFolderFilter: (folderId) => set({ folderFilter: folderId }),
  setFavoriteFilter: (enabled) => set({ favoriteFilter: enabled }),
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
}));
