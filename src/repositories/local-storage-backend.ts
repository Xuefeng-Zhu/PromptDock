import { load, type Store } from '@tauri-apps/plugin-store';
import type { PromptRecipe, Folder, UserSettings, Workspace } from '../types/index';

// ─── Serialization Helpers ─────────────────────────────────────────────────────
// Dates are serialized as ISO strings in JSON. These helpers convert between
// the runtime Date objects and their serialized form.

interface SerializedPromptRecipe extends Omit<PromptRecipe, 'createdAt' | 'updatedAt' | 'archivedAt' | 'lastUsedAt'> {
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  lastUsedAt: string | null;
}

interface SerializedFolder extends Omit<Folder, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface SerializedWorkspace extends Omit<Workspace, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function serializePrompt(recipe: PromptRecipe): SerializedPromptRecipe {
  return {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    archivedAt: recipe.archivedAt ? recipe.archivedAt.toISOString() : null,
    lastUsedAt: recipe.lastUsedAt ? recipe.lastUsedAt.toISOString() : null,
  };
}

function deserializePrompt(raw: SerializedPromptRecipe): PromptRecipe {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt) : null,
    lastUsedAt: raw.lastUsedAt ? new Date(raw.lastUsedAt) : null,
  };
}

function serializeFolder(folder: Folder): SerializedFolder {
  return {
    ...folder,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

function deserializeFolder(raw: SerializedFolder): Folder {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

function serializeWorkspace(workspace: Workspace): SerializedWorkspace {
  return {
    ...workspace,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

function deserializeWorkspace(raw: SerializedWorkspace): Workspace {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

// ─── Store File Names ──────────────────────────────────────────────────────────

const STORE_FILES = {
  prompts: 'prompts.json',
  folders: 'folders.json',
  settings: 'settings.json',
  workspace: 'workspace.json',
} as const;

const DATA_KEY = 'data';

// ─── Default Values ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  hotkeyCombo: 'CommandOrControl+Shift+P',
  theme: 'system',
  defaultAction: 'paste',
  activeWorkspaceId: 'local',
};

const DEFAULT_WORKSPACE: Workspace = {
  id: 'local',
  name: 'My Prompts',
  ownerId: 'local',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── LocalStorageBackend ───────────────────────────────────────────────────────

export class LocalStorageBackend {
  private stores: Map<string, Store> = new Map();
  private initialized = false;

  /**
   * Load a Tauri Store for the given file, handling corrupted data by
   * preserving the file as `.backup` and reinitializing.
   */
  private async loadStore(fileName: string): Promise<Store> {
    const existing = this.stores.get(fileName);
    if (existing) return existing;

    try {
      const store = await load(fileName, { autoSave: false });
      this.stores.set(fileName, store);
      return store;
    } catch (error) {
      console.error(`Failed to load store "${fileName}":`, error);
      // Attempt to load with createNew to reinitialize
      try {
        const store = await load(fileName, { autoSave: false, createNew: true });
        this.stores.set(fileName, store);
        return store;
      } catch (retryError) {
        console.error(`Failed to reinitialize store "${fileName}":`, retryError);
        throw retryError;
      }
    }
  }

  /**
   * Read data from a store file. Returns undefined if the key doesn't exist
   * or the data is corrupted.
   */
  private async readFromStore<T>(fileName: string): Promise<T | undefined> {
    const store = await this.loadStore(fileName);
    try {
      return await store.get<T>(DATA_KEY);
    } catch (error) {
      console.error(`Corrupted data in "${fileName}", recovering:`, error);
      await this.recoverCorruptedStore(fileName, store);
      return undefined;
    }
  }

  /**
   * Write data to a store file with immediate disk persistence.
   */
  private async writeToStore<T>(fileName: string, data: T): Promise<void> {
    const store = await this.loadStore(fileName);
    await store.set(DATA_KEY, data);
    await store.save();
  }

  /**
   * Handle corrupted file recovery: preserve as .backup, clear, and save.
   */
  private async recoverCorruptedStore(fileName: string, store: Store): Promise<void> {
    console.warn(`Recovering corrupted store "${fileName}". Data preserved as backup.`);
    try {
      // Attempt to preserve the corrupted data by saving current state as backup
      const backupName = fileName.replace('.json', '.backup.json');
      try {
        const backupStore = await load(backupName, { autoSave: false });
        // Copy all entries from corrupted store to backup
        const entries = await store.entries();
        for (const [key, value] of entries) {
          await backupStore.set(key, value);
        }
        await backupStore.save();
      } catch {
        // If backup also fails, just log and continue
        console.warn(`Could not create backup for "${fileName}"`);
      }

      // Clear the corrupted store and save
      await store.clear();
      await store.save();
    } catch (clearError) {
      console.error(`Failed to clear corrupted store "${fileName}":`, clearError);
    }
  }

  // ─── Initialization ────────────────────────────────────────────────────────

  /**
   * Load all persisted data on startup. Must be called before any read/write
   * operations.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Pre-load all stores
    await Promise.all(
      Object.values(STORE_FILES).map((fileName) => this.loadStore(fileName))
    );

    // Ensure settings and workspace have defaults if empty
    const settings = await this.readFromStore(STORE_FILES.settings);
    if (settings === undefined) {
      await this.writeSettings(DEFAULT_SETTINGS);
    }

    const workspace = await this.readFromStore(STORE_FILES.workspace);
    if (workspace === undefined) {
      await this.writeWorkspace(DEFAULT_WORKSPACE);
    }

    this.initialized = true;
  }

  // ─── Prompts ───────────────────────────────────────────────────────────────

  async readPrompts(): Promise<PromptRecipe[]> {
    const raw = await this.readFromStore<SerializedPromptRecipe[]>(STORE_FILES.prompts);
    if (!raw || !Array.isArray(raw)) return [];
    try {
      return raw.map(deserializePrompt);
    } catch (error) {
      console.error('Failed to deserialize prompts, recovering:', error);
      const store = await this.loadStore(STORE_FILES.prompts);
      await this.recoverCorruptedStore(STORE_FILES.prompts, store);
      return [];
    }
  }

  async writePrompts(prompts: PromptRecipe[]): Promise<void> {
    const serialized = prompts.map(serializePrompt);
    await this.writeToStore(STORE_FILES.prompts, serialized);
  }

  // ─── Folders ───────────────────────────────────────────────────────────────

  async readFolders(): Promise<Folder[]> {
    const raw = await this.readFromStore<SerializedFolder[]>(STORE_FILES.folders);
    if (!raw || !Array.isArray(raw)) return [];
    try {
      return raw.map(deserializeFolder);
    } catch (error) {
      console.error('Failed to deserialize folders, recovering:', error);
      const store = await this.loadStore(STORE_FILES.folders);
      await this.recoverCorruptedStore(STORE_FILES.folders, store);
      return [];
    }
  }

  async writeFolders(folders: Folder[]): Promise<void> {
    const serialized = folders.map(serializeFolder);
    await this.writeToStore(STORE_FILES.folders, serialized);
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async readSettings(): Promise<UserSettings> {
    const raw = await this.readFromStore<UserSettings>(STORE_FILES.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return raw;
  }

  async writeSettings(settings: UserSettings): Promise<void> {
    await this.writeToStore(STORE_FILES.settings, settings);
  }

  // ─── Workspace ─────────────────────────────────────────────────────────────

  async readWorkspace(): Promise<Workspace> {
    const raw = await this.readFromStore<SerializedWorkspace>(STORE_FILES.workspace);
    if (!raw) return { ...DEFAULT_WORKSPACE, createdAt: new Date(), updatedAt: new Date() };
    try {
      return deserializeWorkspace(raw);
    } catch (error) {
      console.error('Failed to deserialize workspace, recovering:', error);
      const store = await this.loadStore(STORE_FILES.workspace);
      await this.recoverCorruptedStore(STORE_FILES.workspace, store);
      return { ...DEFAULT_WORKSPACE, createdAt: new Date(), updatedAt: new Date() };
    }
  }

  async writeWorkspace(workspace: Workspace): Promise<void> {
    const serialized = serializeWorkspace(workspace);
    await this.writeToStore(STORE_FILES.workspace, serialized);
  }
}

// ─── Exported Helpers (for testing) ────────────────────────────────────────────

export {
  serializePrompt,
  deserializePrompt,
  serializeFolder,
  deserializeFolder,
  serializeWorkspace,
  deserializeWorkspace,
  DEFAULT_SETTINGS,
  DEFAULT_WORKSPACE,
  STORE_FILES,
};
