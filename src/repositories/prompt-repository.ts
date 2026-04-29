import { v4 as uuidv4 } from 'uuid';
import type { PromptRecipe } from '../types';
import type { IPromptRepository } from './interfaces';
import { localStorageBackend } from './local-storage-backend';

export class PromptRepository implements IPromptRepository {
  private store = localStorageBackend;

  async create(recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptRecipe> {
    const now = new Date();
    const prompt: PromptRecipe = {
      ...recipe,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const all = await this.store.readAll<PromptRecipe>('prompts');
    all.push(prompt);
    await this.store.writeAll('prompts', all);
    return prompt;
  }

  async getById(id: string): Promise<PromptRecipe | null> {
    const all = await this.store.readAll<PromptRecipe>('prompts');
    return all.find((p) => p.id === id) ?? null;
  }

  async getAll(workspaceId: string): Promise<PromptRecipe[]> {
    const all = await this.store.readAll<PromptRecipe>('prompts');
    return all.filter((p) => p.workspaceId === workspaceId);
  }

  async update(id: string, changes: Partial<PromptRecipe>): Promise<PromptRecipe> {
    const all = await this.store.readAll<PromptRecipe>('prompts');
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Prompt ${id} not found`);
    all[idx] = { ...all[idx], ...changes, updatedAt: new Date() };
    all[idx].version = (all[idx].version || 0) + 1;
    await this.store.writeAll('prompts', all);
    return all[idx];
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { archived: true, archivedAt: new Date() });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { archived: false, archivedAt: null });
  }

  async duplicate(id: string): Promise<PromptRecipe> {
    const original = await this.getById(id);
    if (!original) throw new Error(`Prompt ${id} not found`);
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = original;
    return this.create({ ...rest, title: `Copy of ${original.title}`, version: 1 });
  }

  async toggleFavorite(id: string): Promise<PromptRecipe> {
    const prompt = await this.getById(id);
    if (!prompt) throw new Error(`Prompt ${id} not found`);
    return this.update(id, { favorite: !prompt.favorite });
  }
}
