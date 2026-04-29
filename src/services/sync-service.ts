import type { PromptRecipe } from '../types';
import { initializeFirebase } from '../firebase/config';

export class SyncService {
  private unsubscribe: (() => void) | null = null;

  async startSync(workspaceId: string, onUpdate: (prompts: PromptRecipe[]) => void): Promise<void> {
    const { db } = await initializeFirebase();
    const { collection, onSnapshot } = await import('firebase/firestore');
    const col = collection(db, 'workspaces', workspaceId, 'prompts');

    this.unsubscribe = onSnapshot(col, (snap) => {
      const prompts = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt),
          archivedAt: data.archivedAt ? (data.archivedAt.toDate?.() ?? new Date(data.archivedAt)) : null,
          lastUsedAt: data.lastUsedAt ? (data.lastUsedAt.toDate?.() ?? new Date(data.lastUsedAt)) : null,
        } as PromptRecipe;
      });
      onUpdate(prompts);
    });
  }

  stopSync(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
