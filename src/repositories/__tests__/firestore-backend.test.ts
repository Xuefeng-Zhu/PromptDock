import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import { FirestoreBackend } from '../firestore-backend';

const firebaseConfigMocks = vi.hoisted(() => ({
  getFirebaseFirestore: vi.fn(async () => ({ name: 'firestore' })),
}));

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(async () => ({ id: 'created-prompt' })),
  collection: vi.fn((_firestore: unknown, ...path: string[]) => ({ path })),
  doc: vi.fn((_firestore: unknown, ...path: string[]) => ({
    id: path[path.length - 1],
    path,
  })),
  getDoc: vi.fn(async (ref: { id: string }) => ({
    id: ref.id,
    exists: () => true,
    data: () => ({
      workspaceId: 'workspace-1',
      title: 'Updated prompt',
      description: '',
      body: 'Updated body',
      tags: [],
      folderId: null,
      favorite: false,
      archived: false,
      archivedAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      lastUsedAt: null,
      createdBy: 'user-1',
      version: 2,
    }),
  })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  increment: vi.fn((value: number) => ({ increment: value })),
  query: vi.fn((collectionRef: unknown) => collectionRef),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ date })),
  },
  updateDoc: vi.fn(async (_ref: unknown, _data: Record<string, unknown>) => undefined),
  where: vi.fn(() => ({})),
}));

vi.mock('../../firebase/config', () => firebaseConfigMocks);
vi.mock('firebase/firestore', () => firestoreMocks);

function makePromptInput(
  overrides: Partial<Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>> = {},
): Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    workspaceId: 'workspace-1',
    title: 'New prompt',
    description: '',
    body: 'Write a {{tone}} update.',
    tags: ['updates'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'user-1',
    version: 1,
    ...overrides,
  };
}

describe('FirestoreBackend workspace scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseConfigMocks.getFirebaseFirestore.mockResolvedValue({ name: 'firestore' });
  });

  it('rejects prompt creation when the payload workspace differs from the backend scope', async () => {
    const backend = new FirestoreBackend('workspace-1');

    await expect(
      backend.create(makePromptInput({ workspaceId: 'workspace-2' })),
    ).rejects.toThrow('Firestore prompt workspace mismatch');

    expect(firestoreMocks.addDoc).not.toHaveBeenCalled();
  });

  it('writes prompt creation payloads only after workspace scope validation passes', async () => {
    const backend = new FirestoreBackend('workspace-1');

    await backend.create(makePromptInput());

    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: ['workspaces', 'workspace-1', 'prompts'] }),
      expect.objectContaining({ workspaceId: 'workspace-1' }),
    );
  });

  it('rejects prompt list reads for a workspace outside the backend scope', async () => {
    const backend = new FirestoreBackend('workspace-1');

    await expect(backend.getAll('workspace-2')).rejects.toThrow(
      'Firestore prompt workspace mismatch',
    );

    expect(firestoreMocks.getDocs).not.toHaveBeenCalled();
  });

  it('rejects prompt updates that try to move a prompt to another workspace', async () => {
    const backend = new FirestoreBackend('workspace-1');

    await expect(
      backend.update('prompt-1', { workspaceId: 'workspace-2' }),
    ).rejects.toThrow('Firestore prompt workspace mismatch');

    expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
  });

  it('does not send workspaceId in prompt update payloads', async () => {
    const backend = new FirestoreBackend('workspace-1');

    await backend.update('prompt-1', {
      workspaceId: 'workspace-1',
      title: 'Updated prompt',
    });

    const updatePayload = firestoreMocks.updateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(updatePayload.workspaceId).toBeUndefined();
    expect(updatePayload.title).toBe('Updated prompt');
  });
});
