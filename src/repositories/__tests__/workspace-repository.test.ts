import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workspace } from '../../types/index';
import { WorkspaceRepository } from '../workspace-repository';
import type { LocalStorageBackend } from '../local-storage-backend';

const firestoreMocks = vi.hoisted(() => {
  type DocSnapshot = {
    data: () => Record<string, unknown>;
    id: string;
    path: string;
    ref: { id: string; path: string };
  };
  const state = {
    batches: [] as Array<{ commit: ReturnType<typeof vi.fn>; operations: string[] }>,
    collectionDocs: new Map<string, DocSnapshot[]>(),
    workspaceExists: false,
    workspaceData: {
      name: 'Personal Workspace',
      ownerId: 'user-1',
      createdAt: { toDate: () => new Date('2023-01-01T00:00:00.000Z') },
      updatedAt: { toDate: () => new Date('2023-01-02T00:00:00.000Z') },
    } as Record<string, unknown>,
  };

  const lastPathSegment = (path: string) => path.split('/').slice(-1)[0] ?? path;
  const makeRef = (path: string) => ({
    id: lastPathSegment(path),
    path,
  });
  const makeDoc = (path: string, data: Record<string, unknown>) => ({
    data: () => data,
    id: lastPathSegment(path),
    path,
    ref: makeRef(path),
  });

  return {
    state,
    collection: vi.fn((_firestore: unknown, ...path: string[]) => ({ path: path.join('/') })),
    doc: vi.fn((_firestore: unknown, ...path: string[]) => makeRef(path.join('/'))),
    getDoc: vi.fn(async (ref: { id?: string; path: string }) => ({
      data: () => state.workspaceData,
      exists: () => ref.path === 'workspaces/user-1' && state.workspaceExists,
      id: ref.id ?? lastPathSegment(ref.path),
    })),
    getDocs: vi.fn(async (ref: { path: string }) => ({
      docs: state.collectionDocs.get(ref.path) ?? [],
    })),
    makeDoc,
    query: vi.fn((collectionRef: unknown) => collectionRef),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    setDoc: vi.fn(async () => undefined),
    where: vi.fn(() => ({})),
    writeBatch: vi.fn(() => {
      const batch = {
        commit: vi.fn(async () => undefined),
        delete: vi.fn((ref: { path: string }) => {
          batch.operations.push(`delete:${ref.path}`);
        }),
        operations: [] as string[],
        update: vi.fn((ref: { path: string }) => {
          batch.operations.push(`update:${ref.path}`);
        }),
      };
      state.batches.push(batch);
      return batch;
    }),
  };
});

vi.mock('../../firebase/config', () => ({
  getFirebaseFirestore: vi.fn(async () => ({})),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  query: firestoreMocks.query,
  serverTimestamp: firestoreMocks.serverTimestamp,
  setDoc: firestoreMocks.setDoc,
  where: firestoreMocks.where,
  writeBatch: firestoreMocks.writeBatch,
}));

// ─── Mock LocalStorageBackend ──────────────────────────────────────────────────

const DEFAULT_WORKSPACE: Workspace = {
  id: 'local',
  name: 'My Prompts',
  ownerId: 'local',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createMockBackend(initial?: Workspace): LocalStorageBackend {
  let stored: Workspace = initial ? { ...initial } : { ...DEFAULT_WORKSPACE };

  return {
    readWorkspace: vi.fn(async () => ({ ...stored })),
    writeWorkspace: vi.fn(async (workspace: Workspace) => {
      stored = { ...workspace };
    }),
  } as unknown as LocalStorageBackend;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkspaceRepository', () => {
  let backend: LocalStorageBackend;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.state.batches = [];
    firestoreMocks.state.collectionDocs = new Map();
    firestoreMocks.state.workspaceExists = false;
    backend = createMockBackend();
    repo = new WorkspaceRepository(backend);
  });

  describe('getById', () => {
    it('should return the local workspace when id matches', async () => {
      const result = await repo.getById('local');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('local');
      expect(result!.name).toBe('My Prompts');
      expect(result!.ownerId).toBe('local');
    });

    it('should return null when id does not match', async () => {
      const result = await repo.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should load from backend on first access', async () => {
      await repo.getById('local');

      expect(backend.readWorkspace).toHaveBeenCalledOnce();
    });

    it('should use cached data on subsequent accesses', async () => {
      await repo.getById('local');
      await repo.getById('local');

      expect(backend.readWorkspace).toHaveBeenCalledOnce();
    });
  });

  describe('listForUser', () => {
    it('should return the single local workspace', async () => {
      const result = await repo.listForUser('local');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('local');
      expect(result[0].name).toBe('My Prompts');
    });

    it('should return the local workspace regardless of userId', async () => {
      const result = await repo.listForUser('some-other-user');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('local');
    });
  });

  describe('create', () => {
    it('should create a workspace with local id and timestamps', async () => {
      const before = new Date();
      const result = await repo.create({
        name: 'New Workspace',
        ownerId: 'local',
      });

      expect(result.id).toBe('local');
      expect(result.name).toBe('New Workspace');
      expect(result.ownerId).toBe('local');
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should persist the created workspace to the backend', async () => {
      await repo.create({
        name: 'Persisted Workspace',
        ownerId: 'local',
      });

      expect(backend.writeWorkspace).toHaveBeenCalled();
    });

    it('should overwrite the existing workspace in local mode', async () => {
      await repo.create({
        name: 'Overwritten',
        ownerId: 'local',
      });

      const result = await repo.getById('local');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Overwritten');
    });
  });

  describe('update', () => {
    it('should update workspace fields and set updatedAt', async () => {
      const before = new Date();
      const result = await repo.update('local', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should not allow id to be overwritten', async () => {
      const result = await repo.update('local', {
        id: 'new-id',
      } as Partial<Workspace>);

      expect(result.id).toBe('local');
    });

    it('should persist the updated workspace to the backend', async () => {
      await repo.update('local', { name: 'Persisted Update' });

      expect(backend.writeWorkspace).toHaveBeenCalled();
    });

    it('should throw when workspace not found', async () => {
      await expect(
        repo.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('Workspace not found: nonexistent');
    });

    it('should preserve fields not included in changes', async () => {
      const result = await repo.update('local', { name: 'New Name' });

      expect(result.ownerId).toBe('local');
      expect(result.id).toBe('local');
    });
  });

  describe('bootstrapPersonalWorkspace', () => {
    it('does not overwrite createdAt when the personal workspace already exists', async () => {
      firestoreMocks.state.workspaceExists = true;

      const result = await repo.bootstrapPersonalWorkspace({
        uid: 'user-1',
        email: 'user@example.com',
        displayName: 'User One',
      });

      expect(result.createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'workspaces/user-1' }),
        expect.not.objectContaining({ createdAt: expect.anything() }),
        { merge: true },
      );
    });

    it('sets createdAt when creating the personal workspace for the first time', async () => {
      await repo.bootstrapPersonalWorkspace({
        uid: 'user-1',
        email: 'user@example.com',
        displayName: 'User One',
      });

      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'workspaces/user-1' }),
        expect.objectContaining({ createdAt: 'server-timestamp' }),
        { merge: true },
      );
    });
  });

  describe('deleteSyncedWorkspace', () => {
    it('chunks large workspace deletions and keeps owner records with the workspace delete', async () => {
      const promptDocs = Array.from({ length: 451 }, (_, index) =>
        firestoreMocks.makeDoc(`workspaces/workspace-1/prompts/prompt-${index}`, {}),
      );
      firestoreMocks.state.collectionDocs.set('workspaces/workspace-1/members', [
        firestoreMocks.makeDoc('workspaces/workspace-1/members/user-1', {
          role: 'owner',
          userId: 'user-1',
        }),
      ]);
      firestoreMocks.state.collectionDocs.set('workspaces/workspace-1/prompts', promptDocs);
      firestoreMocks.state.collectionDocs.set('workspaces/workspace-1/folders', []);
      firestoreMocks.state.collectionDocs.set('workspaces/workspace-1/conflicts', []);
      firestoreMocks.state.collectionDocs.set('workspaceInvites', []);

      await repo.deleteSyncedWorkspace('workspace-1');

      expect(firestoreMocks.state.batches).toHaveLength(3);
      expect(firestoreMocks.state.batches[0].operations).toHaveLength(450);
      expect(firestoreMocks.state.batches[1].operations).toHaveLength(1);
      expect(firestoreMocks.state.batches[2].operations).toEqual([
        'delete:workspaces/workspace-1/members/user-1',
        'delete:workspaceMemberships/workspace-1_user-1',
        'delete:workspaces/workspace-1',
      ]);
      firestoreMocks.state.batches.forEach((batch) => {
        expect(batch.operations.length).toBeLessThanOrEqual(450);
        expect(batch.commit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
