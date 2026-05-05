import type { PromptRecipe, Folder, UserSettings, Workspace } from '../types/index';
import type { IStorageBackend } from './interfaces';

// ─── Constants ─────────────────────────────────────────────────────────────────

const KEYS = {
  prompts: 'promptdock:prompts',
  folders: 'promptdock:folders',
  settings: 'promptdock:settings',
  workspace: 'promptdock:workspace',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  hotkeyCombo: 'CommandOrControl+Shift+P',
  theme: 'system',
  defaultAction: 'copy',
  activeWorkspaceId: 'local',
};

const DEFAULT_WORKSPACE: Workspace = {
  id: 'local',
  name: 'My Prompts',
  ownerId: 'local',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Date Serialization Helpers ────────────────────────────────────────────────

function reviveDates<T>(obj: T, dateKeys: string[]): T {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj } as Record<string, unknown>;
  for (const key of dateKeys) {
    const val = result[key];
    if (typeof val === 'string') {
      result[key] = new Date(val);
    }
  }
  return result as T;
}

// ─── BrowserStorageBackend ─────────────────────────────────────────────────────

/**
 * Persistence backend using window.localStorage for browser environments.
 * Drop-in replacement for LocalStorageBackend (Tauri Store) — implements
 * the same IStorageBackend interface so repositories work unchanged.
 */
export class BrowserStorageBackend implements IStorageBackend {
  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async initialize(): Promise<void> {
    // Ensure defaults exist
    if (!localStorage.getItem(KEYS.settings)) {
      this.write(KEYS.settings, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(KEYS.workspace)) {
      this.write(KEYS.workspace, DEFAULT_WORKSPACE);
    }
  }

  // ── Prompts ────────────────────────────────────────────────────────────────

  async readPrompts(): Promise<PromptRecipe[]> {
    const raw = this.read<PromptRecipe[]>(KEYS.prompts);
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((p) =>
      reviveDates(p, ['createdAt', 'updatedAt', 'archivedAt', 'lastUsedAt']),
    );
  }

  async writePrompts(prompts: PromptRecipe[]): Promise<void> {
    this.write(KEYS.prompts, prompts);
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  async readFolders(): Promise<Folder[]> {
    const raw = this.read<Folder[]>(KEYS.folders);
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((f) => reviveDates(f, ['createdAt', 'updatedAt']));
  }

  async writeFolders(folders: Folder[]): Promise<void> {
    this.write(KEYS.folders, folders);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async readSettings(): Promise<UserSettings> {
    const raw = this.read<UserSettings>(KEYS.settings);
    return raw ?? { ...DEFAULT_SETTINGS };
  }

  async writeSettings(settings: UserSettings): Promise<void> {
    this.write(KEYS.settings, settings);
  }

  // ── Workspace ──────────────────────────────────────────────────────────────

  async readWorkspace(): Promise<Workspace> {
    const raw = this.read<Workspace>(KEYS.workspace);
    if (!raw) return { ...DEFAULT_WORKSPACE, createdAt: new Date(), updatedAt: new Date() };
    return reviveDates(raw, ['createdAt', 'updatedAt']);
  }

  async writeWorkspace(workspace: Workspace): Promise<void> {
    this.write(KEYS.workspace, workspace);
  }
}
