import { create, type StoreApi, useStore } from 'zustand';
import type { IFolderRepository } from '../repositories/interfaces';
import type { Folder } from '../types/index';

export interface FolderStore {
  folders: Folder[];
  isLoading: boolean;
  activeWorkspaceId: string;
  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder>;
  setActiveWorkspaceId: (workspaceId: string) => void;
  setFolders: (folders: Folder[]) => void;
}

function upsertFolder(folders: Folder[], folder: Folder): Folder[] {
  const existingIndex = folders.findIndex((item) => item.id === folder.id);
  if (existingIndex === -1) return [...folders, folder];

  return folders.map((item, index) => (index === existingIndex ? folder : item));
}

export function createFolderStore(repo: IFolderRepository) {
  return create<FolderStore>((set, get) => ({
    folders: [],
    isLoading: false,
    activeWorkspaceId: 'local',

    async loadFolders() {
      set({ isLoading: true });
      try {
        const { activeWorkspaceId } = get();
        const folders = repo.reloadAllFolders
          ? await repo.reloadAllFolders(activeWorkspaceId)
          : await repo.getAllFolders(activeWorkspaceId);
        set({ folders, isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    async createFolder(name: string) {
      const { activeWorkspaceId } = get();
      const folder = await repo.createFolder(name, activeWorkspaceId);
      set((state) => ({ folders: upsertFolder(state.folders, folder) }));
      return folder;
    },

    setActiveWorkspaceId(workspaceId: string) {
      set({ activeWorkspaceId: workspaceId });
    },

    setFolders(folders: Folder[]) {
      set({ folders });
    },
  }));
}

let _store: StoreApi<FolderStore> | null = null;

export function initFolderStore(repo: IFolderRepository): StoreApi<FolderStore> {
  _store = createFolderStore(repo);
  return _store;
}

export function useFolderStore(): FolderStore;
export function useFolderStore<T>(selector: (state: FolderStore) => T): T;
export function useFolderStore<T>(selector?: (state: FolderStore) => T) {
  if (!_store) {
    throw new Error(
      'FolderStore has not been initialised. Call initFolderStore(repo) before using useFolderStore.',
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return selector ? useStore(_store, selector) : useStore(_store);
}
