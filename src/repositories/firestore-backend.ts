import { v4 as uuidv4 } from 'uuid';
import type { PromptRecipe } from '../types';
import type { IPromptRepository } from './interfaces';
import { initializeFirebase } from '../firebase/config';

export class FirestoreBackend implements IPromptRepository {
  private async getCollection(workspaceId: string) {
    const { db } = await initializeFirebase();
    const { collection } = await import('firebase/firestore');
    return collection(db, 'workspaces', workspaceId, 'prompts');
  }

  async create(recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptRecipe> {
    const { db } = await initializeFirebase();
    const { doc, setDoc } = await import('firebase/firestore');
    const now = new Date();
    const id = uuidv4();
    const prompt: PromptRecipe = { ...recipe, id, createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'workspaces', recipe.workspaceId, 'prompts', id), this.toFirestore(prompt));
    return prompt;
  }

  async getById(id: string): Promise<PromptRecipe | null> {
    // Requires workspaceId context - simplified for now
    return null;
  }

  async getAll(workspaceId: string): Promise<PromptRecipe[]> {
    const { db } = await initializeFirebase();
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'workspaces', workspaceId, 'prompts'));
    return snap.docs.map((d) => this.fromFirestore(d.data()));
  }

  async update(id: string, changes: Partial<PromptRecipe>): Promise<PromptRecipe> {
    // Simplified - needs workspaceId context
    throw new Error('Use with workspaceId context');
  }

  async softDelete(id: string): Promise<void> {
    // Simplified
  }

  async restore(id: string): Promise<void> {
    // Simplified
  }

  async duplicate(id: string): Promise<PromptRecipe> {
    throw new Error('Use with workspaceId context');
  }

  async toggleFavorite(id: string): Promise<PromptRecipe> {
    throw new Error('Use with workspaceId context');
  }

  private toFirestore(p: PromptRecipe): Record<string, unknown> {
    return {
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      archivedAt: p.archivedAt instanceof Date ? p.archivedAt.toISOString() : p.archivedAt,
      lastUsedAt: p.lastUsedAt instanceof Date ? p.lastUsedAt.toISOString() : p.lastUsedAt,
    };
  }

  private fromFirestore(data: Record<string, unknown>): PromptRecipe {
    return {
      id: data.id as string,
      workspaceId: data.workspaceId as string,
      title: data.title as string,
      description: (data.description as string) ?? '',
      body: data.body as string,
      tags: (data.tags as string[]) ?? [],
      folderId: (data.folderId as string | null) ?? null,
      favorite: (data.favorite as boolean) ?? false,
      archived: (data.archived as boolean) ?? false,
      archivedAt: data.archivedAt ? new Date(data.archivedAt as string) : null,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt as string) : null,
      createdBy: (data.createdBy as string) ?? 'local',
      version: (data.version as number) ?? 1,
    };
  }
}
