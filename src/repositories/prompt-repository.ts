import type { PromptRecipe } from '../types/index';
import type { IPromptRepository, IStorageBackend } from './interfaces';

// ─── PromptRepository ──────────────────────────────────────────────────────────
// Implements IPromptRepository by delegating to an IStorageBackend in Local Mode.
// When a Firestore delegate is set (synced mode), all operations are forwarded
// to the FirestoreBackend instead.
// Maintains an in-memory cache of prompts and persists to the backend on every
// mutation.

export class PromptRepository implements IPromptRepository {
  private prompts: PromptRecipe[] = [];
  private loaded = false;
  private firestoreDelegate: IPromptRepository | null = null;

  constructor(private readonly backend: IStorageBackend) {}

  /**
   * Set a Firestore backend delegate for synced mode.
   * When set, all operations are forwarded to the delegate.
   * Pass null to revert to local-only mode.
   */
  setFirestoreDelegate(delegate: IPromptRepository | null): void {
    this.firestoreDelegate = delegate;
  }

  /**
   * Check if a Firestore delegate is currently active.
   */
  hasFirestoreDelegate(): boolean {
    return this.firestoreDelegate !== null;
  }

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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.create(recipe);
    }

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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.getById(id);
    }

    await this.ensureLoaded();
    return this.prompts.find((p) => p.id === id) ?? null;
  }

  async getAll(workspaceId: string): Promise<PromptRecipe[]> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.getAll(workspaceId);
    }

    await this.ensureLoaded();
    return this.prompts.filter((p) => p.workspaceId === workspaceId);
  }

  async reloadAll(workspaceId: string): Promise<PromptRecipe[]> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.reloadAll
        ? this.firestoreDelegate.reloadAll(workspaceId)
        : this.firestoreDelegate.getAll(workspaceId);
    }

    this.prompts = await this.backend.readPrompts();
    this.loaded = true;
    return this.prompts.filter((p) => p.workspaceId === workspaceId);
  }

  async update(
    id: string,
    changes: Partial<PromptRecipe>,
  ): Promise<PromptRecipe> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.update(id, changes);
    }

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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.softDelete(id);
    }

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

  async delete(id: string): Promise<void> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.delete(id);
    }

    await this.ensureLoaded();

    const initialLength = this.prompts.length;
    this.prompts = this.prompts.filter((p) => p.id !== id);
    if (this.prompts.length === initialLength) {
      throw new Error(`Prompt not found: ${id}`);
    }

    await this.persist();
  }

  async restore(id: string): Promise<void> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.restore(id);
    }

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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.duplicate(id);
    }

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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.toggleFavorite(id);
    }

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
