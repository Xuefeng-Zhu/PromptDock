/**
 * FirestoreBackend — Firestore implementation of IPromptRepository.
 *
 * Operates against Firestore collections: workspaces/{workspaceId}/prompts/{promptId}
 * Includes data converter functions for PromptRecipe, Workspace, and UserSettings.
 * Firestore persistent local cache is enabled via the Firebase config module.
 *
 * Requirements: 7.2, 7.7, 8.1, 8.2, 8.3
 */

import type { PromptRecipe, Workspace, UserSettings } from '../types/index';
import type { IPromptRepository } from './interfaces';

// ─── Firestore Document Types ──────────────────────────────────────────────────
// These represent the shape of documents stored in Firestore, where Date fields
// are stored as Firestore Timestamps.

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

type FirestoreDateValue = FirestoreTimestamp | Date | null | undefined;

export interface FirestorePromptDoc {
  title: string;
  description: string;
  body: string;
  tags: string[];
  folderId: string | null;
  favorite: boolean;
  archived: boolean;
  archivedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  lastUsedAt: FirestoreTimestamp | null;
  createdBy: string;
  version: number;
  workspaceId: string;
}

export interface FirestoreWorkspaceDoc {
  name: string;
  ownerId: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface FirestoreUserSettingsDoc {
  hotkeyCombo: string;
  theme: 'light' | 'dark' | 'system';
  defaultAction: 'copy' | 'paste';
  activeWorkspaceId: string;
}

// ─── Converter Functions ───────────────────────────────────────────────────────

/**
 * Convert a Date to a Firestore Timestamp-like object.
 * In production, use firebase/firestore Timestamp.fromDate().
 * This function creates a plain object for testability.
 */
export function dateToTimestamp(date: Date): FirestoreTimestamp {
  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000);
  const nanoseconds = (ms % 1000) * 1_000_000;
  return {
    seconds,
    nanoseconds,
    toDate() {
      return new Date(this.seconds * 1000 + this.nanoseconds / 1_000_000);
    },
  };
}

/**
 * Convert a FirestoreTimestamp back to a Date.
 */
export function timestampToDate(timestamp: FirestoreDateValue): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (
    typeof timestamp.seconds === 'number' &&
    typeof timestamp.nanoseconds === 'number'
  ) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000);
  }
  return new Date();
}

function nullableTimestampToDate(timestamp: FirestoreDateValue): Date | null {
  return timestamp ? timestampToDate(timestamp) : null;
}

/**
 * Convert a PromptRecipe TypeScript object to a Firestore document.
 */
export function promptRecipeToFirestoreDoc(recipe: PromptRecipe): FirestorePromptDoc {
  return {
    title: recipe.title,
    description: recipe.description,
    body: recipe.body,
    tags: [...recipe.tags],
    folderId: recipe.folderId,
    favorite: recipe.favorite,
    archived: recipe.archived,
    archivedAt: recipe.archivedAt ? dateToTimestamp(recipe.archivedAt) : null,
    createdAt: dateToTimestamp(recipe.createdAt),
    updatedAt: dateToTimestamp(recipe.updatedAt),
    lastUsedAt: recipe.lastUsedAt ? dateToTimestamp(recipe.lastUsedAt) : null,
    createdBy: recipe.createdBy,
    version: recipe.version,
    workspaceId: recipe.workspaceId,
  };
}

/**
 * Convert a Firestore document back to a PromptRecipe TypeScript object.
 */
export function firestoreDocToPromptRecipe(id: string, doc: FirestorePromptDoc): PromptRecipe {
  return {
    id,
    workspaceId: doc.workspaceId,
    title: doc.title,
    description: doc.description,
    body: doc.body,
    tags: [...doc.tags],
    folderId: doc.folderId,
    favorite: doc.favorite,
    archived: doc.archived,
    archivedAt: nullableTimestampToDate(doc.archivedAt),
    createdAt: timestampToDate(doc.createdAt),
    updatedAt: timestampToDate(doc.updatedAt),
    lastUsedAt: nullableTimestampToDate(doc.lastUsedAt),
    createdBy: doc.createdBy,
    version: doc.version,
  };
}

/**
 * Convert a Workspace TypeScript object to a Firestore document.
 */
export function workspaceToFirestoreDoc(workspace: Workspace): FirestoreWorkspaceDoc {
  return {
    name: workspace.name,
    ownerId: workspace.ownerId,
    createdAt: dateToTimestamp(workspace.createdAt),
    updatedAt: dateToTimestamp(workspace.updatedAt),
  };
}

/**
 * Convert a Firestore document back to a Workspace TypeScript object.
 */
export function firestoreDocToWorkspace(id: string, doc: FirestoreWorkspaceDoc): Workspace {
  return {
    id,
    name: doc.name,
    ownerId: doc.ownerId,
    createdAt: timestampToDate(doc.createdAt),
    updatedAt: timestampToDate(doc.updatedAt),
  };
}

/**
 * Convert a UserSettings TypeScript object to a Firestore document.
 */
export function userSettingsToFirestoreDoc(settings: UserSettings): FirestoreUserSettingsDoc {
  return {
    hotkeyCombo: settings.hotkeyCombo,
    theme: settings.theme,
    defaultAction: settings.defaultAction,
    activeWorkspaceId: settings.activeWorkspaceId,
  };
}

/**
 * Convert a Firestore document back to a UserSettings TypeScript object.
 */
export function firestoreDocToUserSettings(doc: FirestoreUserSettingsDoc): UserSettings {
  return {
    hotkeyCombo: doc.hotkeyCombo,
    theme: doc.theme,
    defaultAction: doc.defaultAction,
    activeWorkspaceId: doc.activeWorkspaceId,
  };
}

// ─── FirestoreBackend ──────────────────────────────────────────────────────────

export class FirestoreBackend implements IPromptRepository {
  constructor(private workspaceId: string) {}

  private async getPromptsCollection() {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection } = await import('firebase/firestore');
    const firestore = await getFirebaseFirestore();
    return collection(firestore, 'workspaces', this.workspaceId, 'prompts');
  }

  async create(
    recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PromptRecipe> {
    const { addDoc, serverTimestamp, Timestamp } = await import('firebase/firestore');
    const promptsCol = await this.getPromptsCollection();

    const now = new Date();
    const docData = {
      title: recipe.title,
      description: recipe.description,
      body: recipe.body,
      tags: [...recipe.tags],
      folderId: recipe.folderId,
      favorite: recipe.favorite,
      archived: recipe.archived,
      archivedAt: recipe.archivedAt ? Timestamp.fromDate(recipe.archivedAt) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastUsedAt: recipe.lastUsedAt ? Timestamp.fromDate(recipe.lastUsedAt) : null,
      createdBy: recipe.createdBy,
      version: recipe.version,
      workspaceId: recipe.workspaceId,
    };

    const docRef = await addDoc(promptsCol, docData);

    return {
      ...recipe,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    } as PromptRecipe;
  }

  async getById(id: string): Promise<PromptRecipe | null> {
    const { doc, getDoc } = await import('firebase/firestore');
    const { getFirebaseFirestore } = await import('../firebase/config');
    const firestore = await getFirebaseFirestore();
    const docRef = doc(firestore, 'workspaces', this.workspaceId, 'prompts', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return firestoreDocToPromptRecipe(
      snapshot.id,
      snapshot.data({ serverTimestamps: 'estimate' }) as FirestorePromptDoc,
    );
  }

  async getAll(workspaceId: string): Promise<PromptRecipe[]> {
    const { query, where, getDocs } = await import('firebase/firestore');
    const promptsCol = await this.getPromptsCollection();
    const q = query(promptsCol, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) =>
      firestoreDocToPromptRecipe(
        docSnap.id,
        docSnap.data({ serverTimestamps: 'estimate' }) as FirestorePromptDoc,
      ),
    );
  }

  async update(id: string, changes: Partial<PromptRecipe>): Promise<PromptRecipe> {
    const { doc, updateDoc, getDoc, serverTimestamp, Timestamp, increment } = await import('firebase/firestore');
    const { getFirebaseFirestore } = await import('../firebase/config');
    const firestore = await getFirebaseFirestore();
    const docRef = doc(firestore, 'workspaces', this.workspaceId, 'prompts', id);

    const updateData: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
      version: increment(1),
    };
    // Convert Date fields to Timestamps for Firestore
    if ('archivedAt' in changes) {
      updateData.archivedAt = changes.archivedAt
        ? Timestamp.fromDate(changes.archivedAt)
        : null;
    }
    if ('lastUsedAt' in changes) {
      updateData.lastUsedAt = changes.lastUsedAt
        ? Timestamp.fromDate(changes.lastUsedAt)
        : null;
    }
    // Remove immutable/generated fields from update data.
    delete updateData.id;
    delete updateData.createdAt;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, updateData as Record<string, any>);

    const updated = await getDoc(docRef);
    return firestoreDocToPromptRecipe(
      updated.id,
      updated.data({ serverTimestamps: 'estimate' }) as FirestorePromptDoc,
    );
  }

  async softDelete(id: string): Promise<void> {
    const { doc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore');
    const { getFirebaseFirestore } = await import('../firebase/config');
    const firestore = await getFirebaseFirestore();
    const docRef = doc(firestore, 'workspaces', this.workspaceId, 'prompts', id);

    await updateDoc(docRef, {
      archived: true,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: increment(1),
    });
  }

  async delete(id: string): Promise<void> {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { getFirebaseFirestore } = await import('../firebase/config');
    const firestore = await getFirebaseFirestore();
    const docRef = doc(firestore, 'workspaces', this.workspaceId, 'prompts', id);

    await deleteDoc(docRef);
  }

  async restore(id: string): Promise<void> {
    const { doc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore');
    const { getFirebaseFirestore } = await import('../firebase/config');
    const firestore = await getFirebaseFirestore();
    const docRef = doc(firestore, 'workspaces', this.workspaceId, 'prompts', id);

    await updateDoc(docRef, {
      archived: false,
      archivedAt: null,
      updatedAt: serverTimestamp(),
      version: increment(1),
    });
  }

  async duplicate(id: string): Promise<PromptRecipe> {
    const original = await this.getById(id);
    if (!original) throw new Error(`Prompt not found: ${id}`);

    return this.create({
      workspaceId: original.workspaceId,
      title: `Copy of ${original.title}`,
      description: original.description,
      body: original.body,
      tags: [...original.tags],
      folderId: original.folderId,
      favorite: false,
      archived: false,
      archivedAt: null,
      lastUsedAt: null,
      createdBy: original.createdBy,
      version: 1,
    });
  }

  async toggleFavorite(id: string): Promise<PromptRecipe> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Prompt not found: ${id}`);

    return this.update(id, { favorite: !current.favorite });
  }
}
