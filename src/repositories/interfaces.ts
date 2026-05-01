import type { PromptRecipe, Folder, Workspace, UserSettings } from '../types/index';

// ─── Storage Backend Interface ─────────────────────────────────────────────────

/**
 * Abstraction over the persistence layer. Implemented by:
 * - `LocalStorageBackend` (Tauri Store plugin — desktop)
 * - `BrowserStorageBackend` (window.localStorage — browser)
 */
export interface IStorageBackend {
  initialize(): Promise<void>;
  readPrompts(): Promise<PromptRecipe[]>;
  writePrompts(prompts: PromptRecipe[]): Promise<void>;
  readFolders(): Promise<Folder[]>;
  writeFolders(folders: Folder[]): Promise<void>;
  readSettings(): Promise<UserSettings>;
  writeSettings(settings: UserSettings): Promise<void>;
  readWorkspace(): Promise<Workspace>;
  writeWorkspace(workspace: Workspace): Promise<void>;
}

// ─── Repository Interfaces ────────────────────────────────────────────────────

export interface IPromptRepository {
  create(recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptRecipe>;
  getById(id: string): Promise<PromptRecipe | null>;
  getAll(workspaceId: string): Promise<PromptRecipe[]>;
  update(id: string, changes: Partial<PromptRecipe>): Promise<PromptRecipe>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  duplicate(id: string): Promise<PromptRecipe>;
  toggleFavorite(id: string): Promise<PromptRecipe>;
}

export interface IWorkspaceRepository {
  create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;
  getById(id: string): Promise<Workspace | null>;
  listForUser(userId: string): Promise<Workspace[]>;
  update(id: string, changes: Partial<Workspace>): Promise<Workspace>;
}

export interface ISettingsRepository {
  get(): Promise<UserSettings>;
  update(changes: Partial<UserSettings>): Promise<UserSettings>;
}
