import type { PromptRecipe } from '../types/index';
import type { IPromptRepository } from './interfaces';
import type { LocalStorageBackend } from './local-storage-backend';

// ─── PromptRepository ──────────────────────────────────────────────────────────
// Implements IPromptRepository by delegating to LocalStorageBackend in Local Mode.
// Maintains an in-memory cache of prompts and persists to the backend on every
// mutation.

export class PromptRepository implements IPromptRepository {
  private prompts: PromptRecipe[] = [];
  private loaded = false;

  constructor(private readonly backend: LocalStorageBackend) {}

  /**
   * Ensure the in-memory cache is populated from the backend.
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.prompts = await this.backend.readPrompts();
      this.loaded = true;
    }
  }

  /**
   * Persist the current in-memory cache to the backend.
   */
  private async persist(): Promise<void> {
    await this.backend.writePrompts(this.prompts);
  }

  async create(
    recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PromptRecipe> {
    await this.ensureLoaded();

    const now = new Date();
    const newRecipe: PromptRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      createdBy: 'local',
      version: 1,
    };

    this.prompts.push(newRecipe);
    await this.persist();
    return newRecipe;
  }

  async getById(id: string): Promise<PromptRecipe | null> {
    await this.ensureLoaded();
    return this.prompts.find((p) => p.id === id) ?? null;
  }

  async getAll(workspaceId: string): Promise<PromptRecipe[]> {
    await this.ensureLoaded();
    return this.prompts.filter((p) => p.workspaceId === workspaceId);
  }

  async update(
    id: string,
    changes: Partial<PromptRecipe>,
  ): Promise<PromptRecipe> {
    await this.ensureLoaded();

    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const existing = this.prompts[index];
    const updated: PromptRecipe = {
      ...existing,
      ...changes,
      id: existing.id, // prevent id overwrite
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    this.prompts[index] = updated;
    await this.persist();
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.ensureLoaded();

    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${id}`);
    }

    this.prompts[index] = {
      ...this.prompts[index],
      archived: true,
      archivedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.persist();
  }

  async restore(id: string): Promise<void> {
    await this.ensureLoaded();

    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${id}`);
    }

    this.prompts[index] = {
      ...this.prompts[index],
      archived: false,
      archivedAt: null,
      updatedAt: new Date(),
    };

    await this.persist();
  }

  async duplicate(id: string): Promise<PromptRecipe> {
    await this.ensureLoaded();

    const original = this.prompts.find((p) => p.id === id);
    if (!original) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const now = new Date();
    const duplicated: PromptRecipe = {
      ...original,
      id: crypto.randomUUID(),
      title: `Copy of ${original.title}`,
      createdAt: now,
      updatedAt: now,
      createdBy: 'local',
      version: 1,
      favorite: false,
      archived: false,
      archivedAt: null,
      lastUsedAt: null,
    };

    this.prompts.push(duplicated);
    await this.persist();
    return duplicated;
  }

  async toggleFavorite(id: string): Promise<PromptRecipe> {
    await this.ensureLoaded();

    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${id}`);
    }

    this.prompts[index] = {
      ...this.prompts[index],
      favorite: !this.prompts[index].favorite,
      updatedAt: new Date(),
    };

    await this.persist();
    return this.prompts[index];
  }
}
