import { create, type StoreApi, useStore } from 'zustand';
import type { IFolderRepository } from '../repositories/interfaces';
import type { Folder } from '../types/index';

export interface FolderStore {
  folders: Folder[];
  isLoading: boolean;
  activeWorkspaceId: string;
  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  setActiveWorkspaceId: (workspaceId: string) => void;
  setFolders: (folders: Folder[]) => void;
}

/**
 * Inserts a newly created folder or replaces the existing folder with the same id.
 * Firestore can return an existing folder for duplicate names, so create actions
 * must be idempotent in the local store.
 */
function upsertFolder(folders: Folder[], folder: Folder): Folder[] {
  const existingIndex = folders.findIndex((item) => item.id === folder.id);
  if (existingIndex === -1) return [...folders, folder];

  return folders.map((item, index) => (index === existingIndex ? folder : item));
}

/**
 * Creates the folder Zustand store around an injected repository.
 * The active workspace id determines whether loads/mutations target local data
 * or the synced Firestore delegate behind the repository.
 */
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

    async deleteFolder(id: string) {
      const { activeWorkspaceId } = get();
      await repo.deleteFolder(id, activeWorkspaceId);
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
      }));
    },

    setActiveWorkspaceId(workspaceId: string) {
      set({ activeWorkspaceId: workspaceId });
    },

    setFolders(folders: Folder[]) {
      set({ folders });
    },
  }));
}

interface FolderStoreHotData {
  folderStore?: StoreApi<FolderStore> | null;
}

const hotData = import.meta.hot?.data as FolderStoreHotData | undefined;
let _store: StoreApi<FolderStore> | null = hotData?.folderStore ?? null;

if (import.meta.hot) {
  import.meta.hot.dispose((data: FolderStoreHotData) => {
    data.folderStore = _store;
  });
}

/** Initializes the singleton folder store used by components. */
export function initFolderStore(repo: IFolderRepository): StoreApi<FolderStore> {
  _store = createFolderStore(repo);
  return _store;
}

/**
 * Reads the initialized folder store, optionally through a selector.
 * Throws before initialization so folder UI cannot render against missing data.
 */
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
