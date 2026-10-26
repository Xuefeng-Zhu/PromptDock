import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AuthUser,
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceInvite,
} from '../../types/index';
import { WorkspaceRepository } from '../workspace-repository';
import type { LocalStorageBackend } from '../local-storage-backend';

const firestoreMocks = vi.hoisted(() => {
  type DocSnapshot = {
    data: () => Record<string, unknown>;
    id: string;
    path: string;
    ref: { id: string; path: string };
  };
  type BatchSet = { path: string; data: Record<string, unknown> };
  type BatchUpdate = { path: string; data: Record<string, unknown> };
  const state = {
    batches: [] as Array<{
      commit: ReturnType<typeof vi.fn>;
      deletes: string[];
      operations: string[];
      sets: BatchSet[];
      updates: Array<{ path: string; data: Record<string, unknown> }>;
    }>,
    collectionDocs: new Map<string, DocSnapshot[]>(),
    documentData: new Map<string, Record<string, unknown>>(),
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
    doc: vi.fn((firestoreOrCollection: unknown, ...path: string[]) => {
      if (
        path.length === 0
        && typeof firestoreOrCollection === 'object'
        && firestoreOrCollection !== null
        && 'path' in firestoreOrCollection
      ) {
        return makeRef(`${String(firestoreOrCollection.path)}/workspace-created`);
      }
      return makeRef(path.join('/'));
    }),
    addDoc: vi.fn(async () => makeRef('workspaceInvites/invite-created')),
    getDoc: vi.fn(async (ref: { id?: string; path: string }) => ({
      data: () => state.documentData.get(ref.path) ?? state.workspaceData,
      exists: () =>
        state.documentData.has(ref.path) || (ref.path === 'workspaces/user-1' && state.workspaceExists),
      id: ref.id ?? lastPathSegment(ref.path),
    })),
    getDocs: vi.fn(async (ref: { path: string }) => ({
      docs: state.collectionDocs.get(ref.path) ?? [],
    })),
    makeDoc,
    query: vi.fn((collectionRef: unknown) => collectionRef),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    setDoc: vi.fn(async () => undefined),
    updateDoc: vi.fn(async () => undefined),
    where: vi.fn(() => ({})),
    writeBatch: vi.fn(() => {
      const batch = {
        commit: vi.fn(async () => {
          for (const { data, path } of batch.sets) {
            state.documentData.set(path, data);
          }
          for (const { data, path } of batch.updates) {
            state.documentData.set(path, {
              ...(state.documentData.get(path) ?? {}),
              ...data,
            });
          }
          for (const path of batch.deletes) {
            state.documentData.delete(path);
          }
        }),
        delete: vi.fn((ref: { path: string }) => {
          batch.operations.push(`delete:${ref.path}`);
          batch.deletes.push(ref.path);
        }),
        deletes: [] as string[],
        operations: [] as string[],
        set: vi.fn((ref: { path: string }, data: Record<string, unknown>) => {
          batch.operations.push(`set:${ref.path}`);
          batch.sets.push({ path: ref.path, data });
        }),
        sets: [] as BatchSet[],
        update: vi.fn((ref: { path: string }, data: Record<string, unknown>) => {
          batch.operations.push(`update:${ref.path}`);
          batch.updates.push({ path: ref.path, data });
        }),
        updates: [] as BatchUpdate[],
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
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  query: firestoreMocks.query,
  serverTimestamp: firestoreMocks.serverTimestamp,
  setDoc: firestoreMocks.setDoc,
  updateDoc: firestoreMocks.updateDoc,
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

const syncedWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Design Team',
  ownerId: 'owner-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
};

const domainUser: AuthUser = {
  uid: 'user-2',
  email: 'person@example.com',
  displayName: 'Person Example',
};

function makeDomainInvite(overrides: Partial<WorkspaceDomainInvite> = {}): WorkspaceDomainInvite {
  return {
    id: 'workspace-1_example.com',
    workspaceId: syncedWorkspace.id,
    workspaceName: syncedWorkspace.name,
    ownerId: syncedWorkspace.ownerId,
    domain: 'example.com',
    role: 'viewer',
    status: 'active',
    invitedBy: 'owner-1',
    createdAt: new Date('2024-01-03T00:00:00.000Z'),
    updatedAt: new Date('2024-01-03T00:00:00.000Z'),
    revokedAt: null,
    revokedBy: null,
    ...overrides,
  };
}

function makeInvite(overrides: Partial<WorkspaceInvite> = {}): WorkspaceInvite {
  return {
    id: 'invite-1',
    workspaceId: syncedWorkspace.id,
    workspaceName: syncedWorkspace.name,
    email: domainUser.email,
    role: 'editor',
    status: 'pending',
    invitedBy: 'owner-1',
    createdAt: new Date('2024-01-03T00:00:00.000Z'),
    updatedAt: new Date('2024-01-03T00:00:00.000Z'),
    acceptedAt: null,
    acceptedBy: null,
    ...overrides,
  };
}

function createMockBackend(initial?: Workspace): LocalStorageBackend {
  let stored: Workspace = initial ? { ...initial } : { ...DEFAULT_WORKSPACE };

  return {
    readWorkspace: vi.fn(async () => ({ ...stored })),
    writeWorkspace: vi.fn(async (workspace: Workspace) => {
      stored = { ...workspace };
    }),
  } as unknown as LocalStorageBackend;
}

function seedWorkspaceDocument(workspace = syncedWorkspace) {
  firestoreMocks.state.documentData.set(`workspaces/${workspace.id}`, {
    name: workspace.name,
    ownerId: workspace.ownerId,
    createdAt: { toDate: () => workspace.createdAt },
    updatedAt: { toDate: () => workspace.updatedAt },
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkspaceRepository', () => {
  let backend: LocalStorageBackend;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.state.batches = [];
    firestoreMocks.state.collectionDocs = new Map();
    firestoreMocks.state.documentData = new Map();
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

    it('writes owner records before reading personal workspace metadata', async () => {
      await repo.bootstrapPersonalWorkspace({
        uid: 'user-1',
        email: 'user@example.com',
        displayName: 'User One',
      });

      const getWorkspaceCallOrder = firestoreMocks.getDoc.mock.invocationCallOrder[0];
      const setDocCalls = firestoreMocks.setDoc.mock.calls as unknown as Array<[
        { path: string },
        ...unknown[],
      ]>;
      const memberWriteIndex = setDocCalls.findIndex(
        ([ref]) => ref.path === 'workspaces/user-1/members/user-1',
      );
      const membershipWriteIndex = setDocCalls.findIndex(
        ([ref]) => ref.path === 'workspaceMemberships/user-1_user-1',
      );

      expect(memberWriteIndex).toBeGreaterThanOrEqual(0);
      expect(membershipWriteIndex).toBeGreaterThanOrEqual(0);
      expect(firestoreMocks.setDoc.mock.invocationCallOrder[memberWriteIndex]).toBeLessThan(
        getWorkspaceCallOrder,
      );
      expect(firestoreMocks.setDoc.mock.invocationCallOrder[membershipWriteIndex]).toBeLessThan(
        getWorkspaceCallOrder,
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

    it('surfaces Firestore write failures during personal workspace bootstrap', async () => {
      firestoreMocks.setDoc.mockRejectedValueOnce(new Error('permission denied'));

      await expect(
        repo.bootstrapPersonalWorkspace({
          uid: 'user-1',
          email: 'user@example.com',
          displayName: 'User One',
        }),
      ).rejects.toThrow('permission denied');
    });
  });

  describe('synced workspace reads', () => {
    it('uses the personal membership fallback when membership index reads fail', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('index unavailable'));

      const result = await repo.listMembershipsForUser('user-1');

      expect(result).toMatchObject([
        {
          id: 'user-1_user-1',
          role: 'owner',
          userId: 'user-1',
          workspaceId: 'user-1',
        },
      ]);
    });

    it('skips unreadable workspace metadata without dropping readable workspaces', async () => {
      firestoreMocks.state.collectionDocs.set('workspaceMemberships', [
        firestoreMocks.makeDoc('workspaceMemberships/workspace-1_user-1', {
          workspaceId: 'workspace-1',
          userId: 'user-1',
          role: 'owner',
          workspaceName: 'Design Team',
          ownerId: 'user-1',
        }),
        firestoreMocks.makeDoc('workspaceMemberships/workspace-2_user-1', {
          workspaceId: 'workspace-2',
          userId: 'user-1',
          role: 'viewer',
          workspaceName: 'Research Team',
          ownerId: 'owner-2',
        }),
      ]);
      firestoreMocks.state.documentData.set('workspaces/workspace-2', {
        name: 'Research Team',
        ownerId: 'owner-2',
        createdAt: { toDate: () => new Date('2024-01-03T00:00:00.000Z') },
        updatedAt: { toDate: () => new Date('2024-01-04T00:00:00.000Z') },
      });
      firestoreMocks.getDoc.mockRejectedValueOnce(new Error('metadata unavailable'));

      const result = await repo.listSyncedWorkspacesForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'workspace-2',
        name: 'Research Team',
        ownerId: 'owner-2',
      });
    });

    it('uses the personal workspace fallback when all workspace metadata reads fail', async () => {
      firestoreMocks.state.collectionDocs.set('workspaceMemberships', [
        firestoreMocks.makeDoc('workspaceMemberships/workspace-1_user-1', {
          workspaceId: 'workspace-1',
          userId: 'user-1',
          role: 'owner',
          workspaceName: 'Design Team',
          ownerId: 'user-1',
        }),
      ]);
      firestoreMocks.getDoc.mockRejectedValueOnce(new Error('metadata unavailable'));

      const result = await repo.listSyncedWorkspacesForUser('user-1');

      expect(result).toMatchObject([
        {
          id: 'user-1',
          name: 'Personal Workspace',
          ownerId: 'user-1',
        },
      ]);
    });

    it('returns an empty member list when member reads fail', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('members denied'));

      await expect(repo.listMembers('workspace-1')).resolves.toEqual([]);
    });

    it('returns an empty outgoing invite list when invite reads fail', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('invites denied'));

      await expect(repo.listInvites('workspace-1')).resolves.toEqual([]);
    });

    it('returns an empty pending invite list when invite reads fail during startup', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('pending invites denied'));

      await expect(repo.listPendingInvitesForEmail('USER@example.com')).resolves.toEqual([]);
    });

    it('returns an empty pending domain invite list when domain reads fail during startup', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('domain invites denied'));

      await expect(repo.listPendingDomainInvitesForEmail('user@example.com')).resolves.toEqual([]);
    });

    it('returns an empty domain invite list when owner detail reads fail', async () => {
      firestoreMocks.getDocs.mockRejectedValueOnce(new Error('domain invite detail denied'));

      await expect(repo.listDomainInvites('workspace-1')).resolves.toEqual([]);
    });
  });

  describe('synced workspace writes', () => {
    it('creates a synced workspace with owner member and membership records in one batch', async () => {
      const result = await repo.createSyncedWorkspace(' Product Team ', domainUser);

      expect(result.workspace).toMatchObject({
        id: 'workspace-created',
        name: 'Product Team',
        ownerId: domainUser.uid,
      });
      expect(result.membership).toMatchObject({
        workspaceId: 'workspace-created',
        userId: domainUser.uid,
        role: 'owner',
        workspaceName: 'Product Team',
      });
      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'set:workspaces/workspace-created',
        'set:workspaces/workspace-created/members/user-2',
        'set:workspaceMemberships/workspace-created_user-2',
      ]);
      expect(firestoreMocks.state.batches[0].sets).toEqual([
        {
          path: 'workspaces/workspace-created',
          data: expect.objectContaining({
            createdAt: 'server-timestamp',
            name: 'Product Team',
            ownerId: domainUser.uid,
            updatedAt: 'server-timestamp',
          }),
        },
        {
          path: 'workspaces/workspace-created/members/user-2',
          data: expect.objectContaining({
            email: domainUser.email,
            role: 'owner',
            userId: domainUser.uid,
            workspaceId: 'workspace-created',
          }),
        },
        {
          path: 'workspaceMemberships/workspace-created_user-2',
          data: expect.objectContaining({
            role: 'owner',
            userId: domainUser.uid,
            workspaceId: 'workspace-created',
            workspaceName: 'Product Team',
          }),
        },
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });

    it('accepts email invites by creating membership records and marking the invite accepted', async () => {
      seedWorkspaceDocument();

      const result = await repo.acceptInvite(makeInvite(), domainUser);

      expect(result).toMatchObject({
        workspaceId: syncedWorkspace.id,
        userId: domainUser.uid,
        role: 'editor',
        acceptedInviteId: 'invite-1',
      });
      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'set:workspaces/workspace-1/members/user-2',
        'set:workspaceMemberships/workspace-1_user-2',
        'update:workspaceInvites/invite-1',
      ]);
      expect(firestoreMocks.state.batches[0].sets).toEqual([
        {
          path: 'workspaces/workspace-1/members/user-2',
          data: expect.objectContaining({
            acceptedInviteId: 'invite-1',
            role: 'editor',
            userId: domainUser.uid,
            workspaceId: syncedWorkspace.id,
          }),
        },
        {
          path: 'workspaceMemberships/workspace-1_user-2',
          data: expect.objectContaining({
            acceptedInviteId: 'invite-1',
            role: 'editor',
            userId: domainUser.uid,
            workspaceId: syncedWorkspace.id,
            workspaceName: syncedWorkspace.name,
          }),
        },
      ]);
      expect(firestoreMocks.state.batches[0].updates).toEqual([
        {
          path: 'workspaceInvites/invite-1',
          data: {
            acceptedAt: 'server-timestamp',
            acceptedBy: domainUser.uid,
            status: 'accepted',
            updatedAt: 'server-timestamp',
          },
        },
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });

    it('rejects email invite acceptance when the workspace document is gone', async () => {
      await expect(repo.acceptInvite(makeInvite(), domainUser)).rejects.toThrow(
        'Workspace no longer exists.',
      );

      expect(firestoreMocks.writeBatch).not.toHaveBeenCalled();
    });

    it('updates member role in both member and membership records before returning the member', async () => {
      firestoreMocks.state.documentData.set('workspaces/workspace-1/members/user-2', {
        id: domainUser.uid,
        workspaceId: syncedWorkspace.id,
        userId: domainUser.uid,
        role: 'viewer',
        email: domainUser.email,
        displayName: domainUser.displayName,
      });

      const result = await repo.updateMemberRole(syncedWorkspace.id, domainUser.uid, 'editor');

      expect(result).toMatchObject({
        userId: domainUser.uid,
        role: 'editor',
      });
      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'update:workspaces/workspace-1/members/user-2',
        'update:workspaceMemberships/workspace-1_user-2',
      ]);
      expect(firestoreMocks.state.batches[0].updates).toEqual([
        {
          path: 'workspaces/workspace-1/members/user-2',
          data: { role: 'editor', updatedAt: 'server-timestamp' },
        },
        {
          path: 'workspaceMemberships/workspace-1_user-2',
          data: { role: 'editor', updatedAt: 'server-timestamp' },
        },
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });

    it('removes a member from both workspace members and membership index records', async () => {
      await repo.removeMember(syncedWorkspace.id, domainUser.uid);

      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'delete:workspaces/workspace-1/members/user-2',
        'delete:workspaceMemberships/workspace-1_user-2',
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });

    it('leaves a synced workspace by deleting only the current user membership records', async () => {
      await repo.leaveSyncedWorkspace(syncedWorkspace.id, domainUser.uid);

      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'delete:workspaces/workspace-1/members/user-2',
        'delete:workspaceMemberships/workspace-1_user-2',
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('domain invites', () => {
    it('normalizes domains and writes deterministic active viewer invites', async () => {
      const result = await repo.createDomainInvite(syncedWorkspace, ' @Example.COM ', 'owner-1');

      expect(result).toMatchObject({
        id: 'workspace-1_example.com',
        workspaceId: 'workspace-1',
        domain: 'example.com',
        role: 'viewer',
        status: 'active',
      });
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'workspaceDomainInvites/workspace-1_example.com' }),
        expect.objectContaining({
          domain: 'example.com',
          ownerId: 'owner-1',
          role: 'viewer',
          status: 'active',
          workspaceId: 'workspace-1',
        }),
      );
    });

    it('returns an existing active domain invite without rewriting it', async () => {
      firestoreMocks.state.collectionDocs.set('workspaceDomainInvites', [
        firestoreMocks.makeDoc('workspaceDomainInvites/workspace-1_example.com', {
          workspaceId: syncedWorkspace.id,
          workspaceName: syncedWorkspace.name,
          ownerId: syncedWorkspace.ownerId,
          domain: 'example.com',
          role: 'viewer',
          status: 'active',
          invitedBy: 'owner-1',
        }),
      ]);

      const result = await repo.createDomainInvite(syncedWorkspace, 'example.com', 'owner-1');

      expect(result.status).toBe('active');
      expect(result.domain).toBe('example.com');
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
    });

    it('rewrites a revoked domain invite when adding the domain again', async () => {
      firestoreMocks.state.collectionDocs.set('workspaceDomainInvites', [
        firestoreMocks.makeDoc('workspaceDomainInvites/workspace-1_example.com', {
          workspaceId: syncedWorkspace.id,
          workspaceName: syncedWorkspace.name,
          ownerId: syncedWorkspace.ownerId,
          domain: 'example.com',
          role: 'viewer',
          status: 'revoked',
          invitedBy: 'owner-1',
        }),
      ]);

      const result = await repo.createDomainInvite(syncedWorkspace, 'example.com', 'owner-1');

      expect(result.status).toBe('active');
      expect(firestoreMocks.setDoc).toHaveBeenCalledOnce();
    });

    it('lists active viewer domain invites for the signed-in email domain', async () => {
      firestoreMocks.state.collectionDocs.set('workspaceDomainInvites', [
        firestoreMocks.makeDoc('workspaceDomainInvites/workspace-1_example.com', {
          workspaceId: syncedWorkspace.id,
          workspaceName: syncedWorkspace.name,
          ownerId: syncedWorkspace.ownerId,
          domain: 'example.com',
          role: 'viewer',
          status: 'active',
          invitedBy: 'owner-1',
        }),
        firestoreMocks.makeDoc('workspaceDomainInvites/workspace-2_example.com', {
          workspaceId: 'workspace-2',
          workspaceName: 'Revoked',
          ownerId: 'owner-2',
          domain: 'example.com',
          role: 'viewer',
          status: 'revoked',
          invitedBy: 'owner-2',
        }),
      ]);

      const result = await repo.listPendingDomainInvitesForEmail('PERSON@Example.com');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('workspace-1_example.com');
      expect(firestoreMocks.where).toHaveBeenCalledWith('domain', '==', 'example.com');
      expect(firestoreMocks.where).toHaveBeenCalledWith('status', '==', 'active');
      expect(firestoreMocks.where).toHaveBeenCalledWith('role', '==', 'viewer');
    });

    it('accepts domain invites as viewer memberships without reading workspace metadata', async () => {
      const invite = makeDomainInvite();

      const result = await repo.acceptDomainInvite(invite, domainUser);

      expect(result).toMatchObject({
        userId: domainUser.uid,
        role: 'viewer',
        acceptedDomainInviteId: invite.id,
      });
      expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
      expect(firestoreMocks.state.batches).toHaveLength(1);
      expect(firestoreMocks.state.batches[0].operations).toEqual([
        'set:workspaces/workspace-1/members/user-2',
        'set:workspaceMemberships/workspace-1_user-2',
      ]);
      expect(firestoreMocks.state.batches[0].sets).toEqual([
        {
          path: 'workspaces/workspace-1/members/user-2',
          data: expect.objectContaining({
            acceptedDomainInviteId: invite.id,
            role: 'viewer',
            userId: domainUser.uid,
            workspaceId: syncedWorkspace.id,
          }),
        },
        {
          path: 'workspaceMemberships/workspace-1_user-2',
          data: expect.objectContaining({
            acceptedDomainInviteId: invite.id,
            role: 'viewer',
            userId: domainUser.uid,
            workspaceId: syncedWorkspace.id,
            workspaceName: syncedWorkspace.name,
          }),
        },
      ]);
      expect(firestoreMocks.state.batches[0].commit).toHaveBeenCalledTimes(1);
    });

    it('rejects accepting a domain invite when the email domain does not match', async () => {
      await expect(
        repo.acceptDomainInvite(makeDomainInvite(), {
          ...domainUser,
          email: 'person@other.example.com',
        }),
      ).rejects.toThrow('Your account email does not match this domain invite.');

      expect(firestoreMocks.writeBatch).not.toHaveBeenCalled();
    });

    it('revokes domain invites without deleting their audit record', async () => {
      await repo.revokeDomainInvite('workspace-1_example.com');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'workspaceDomainInvites/workspace-1_example.com' }),
        expect.objectContaining({
          status: 'revoked',
          revokedAt: 'server-timestamp',
          updatedAt: 'server-timestamp',
        }),
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
