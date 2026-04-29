import type { PromptRecipe, Workspace, UserSettings } from '../types';

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
