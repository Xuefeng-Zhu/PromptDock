import { create, type StoreApi, useStore } from 'zustand';
import type { PromptRecipe } from '../types/index';
import type { IPromptRepository } from '../repositories/interfaces';

// ─── CreatePromptData ──────────────────────────────────────────────────────────
// The subset of PromptRecipe fields the caller provides when creating a new
// prompt. The repository fills in id, createdAt, updatedAt, createdBy, and
// version automatically.

export type CreatePromptData = Omit<
  PromptRecipe,
  'id' | 'createdAt' | 'updatedAt'
>;

// ─── PromptStore ───────────────────────────────────────────────────────────────

export interface PromptStore {
  // State
  prompts: PromptRecipe[];
  isLoading: boolean;
  activeWorkspaceId: string;
  selectedPromptId: string | null;
  searchQuery: string;
  folderFilter: string | null;
  favoriteFilter: boolean;

  // Actions
  loadPrompts: () => Promise<void>;
  createPrompt: (data: CreatePromptData) => Promise<void>;
  updatePrompt: (id: string, changes: Partial<PromptRecipe>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  archivePrompt: (id: string) => Promise<void>;
  restorePrompt: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFolderFilter: (folderId: string | null) => void;
  setFavoriteFilter: (enabled: boolean) => void;
}

// ─── Factory ───────────────────────────────────────────────────────────────────
// Accepts a PromptRepository instance (dependency injection) and returns a
// fully-wired Zustand store.

export function createPromptStore(repo: IPromptRepository) {
  return create<PromptStore>((set, get) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    prompts: [],
    isLoading: false,
    activeWorkspaceId: 'local',
    selectedPromptId: null,
    searchQuery: '',
    folderFilter: null,
    favoriteFilter: false,

    // ── Actions ──────────────────────────────────────────────────────────────

    async loadPrompts() {
      set({ isLoading: true });
      try {
        const { activeWorkspaceId } = get();
        const prompts = repo.reloadAll
          ? await repo.reloadAll(activeWorkspaceId)
          : await repo.getAll(activeWorkspaceId);
        set({ prompts, isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    async createPrompt(data: CreatePromptData) {
      const created = await repo.create(data);
      set((state) => ({ prompts: [...state.prompts, created] }));
    },

    async updatePrompt(id: string, changes: Partial<PromptRecipe>) {
      const updated = await repo.update(id, changes);
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
      }));
    },

    async deletePrompt(id: string) {
      await repo.softDelete(id);
      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
        selectedPromptId:
          state.selectedPromptId === id ? null : state.selectedPromptId,
      }));
    },

    async duplicatePrompt(id: string) {
      const duplicated = await repo.duplicate(id);
      set((state) => ({ prompts: [...state.prompts, duplicated] }));
    },

    async toggleFavorite(id: string) {
      const updated = await repo.toggleFavorite(id);
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
      }));
    },

    async archivePrompt(id: string) {
      await repo.softDelete(id);
      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
        selectedPromptId:
          state.selectedPromptId === id ? null : state.selectedPromptId,
      }));
    },

    async restorePrompt(id: string) {
      await repo.restore(id);
      // Reload to get the restored prompt back into the list
      const { activeWorkspaceId } = get();
      const prompts = await repo.getAll(activeWorkspaceId);
      set({ prompts });
    },

    setSearchQuery(query: string) {
      set({ searchQuery: query });
    },

    setFolderFilter(folderId: string | null) {
      set({ folderFilter: folderId });
    },

    setFavoriteFilter(enabled: boolean) {
      set({ favoriteFilter: enabled });
    },
  }));
}

// ─── Singleton convenience hook ────────────────────────────────────────────────
// For production use, call `initPromptStore` once at app startup with the real
// repository, then use `usePromptStore` in components.

let _store: StoreApi<PromptStore> | null = null;

export function initPromptStore(repo: IPromptRepository): StoreApi<PromptStore> {
  _store = createPromptStore(repo);
  return _store;
}

export function usePromptStore(): PromptStore;
export function usePromptStore<T>(selector: (state: PromptStore) => T): T;
export function usePromptStore<T>(selector?: (state: PromptStore) => T) {
  if (!_store) {
    throw new Error(
      'PromptStore has not been initialised. Call initPromptStore(repo) before using usePromptStore.',
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return selector ? useStore(_store, selector) : useStore(_store);
}
