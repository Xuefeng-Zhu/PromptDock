import { create, type StoreApi, useStore } from 'zustand';
import type { IWorkspaceRepository } from '../repositories/interfaces';
import type {
  AuthUser,
  Workspace,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';

const LOCAL_WORKSPACE: Workspace = {
  id: 'local',
  name: 'My Prompts',
  ownerId: 'local',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const LOCAL_MEMBER: WorkspaceMember = {
  id: 'local',
  workspaceId: 'local',
  userId: 'local',
  role: 'owner',
  email: '',
  displayName: null,
  joinedAt: new Date(0),
  updatedAt: new Date(0),
};

export function canEditWorkspace(role: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'editor';
}

function chooseActiveWorkspace(
  workspaces: Workspace[],
  preferredWorkspaceId: string | undefined,
  fallbackWorkspaceId: string,
): string {
  if (preferredWorkspaceId && workspaces.some((workspace) => workspace.id === preferredWorkspaceId)) {
    return preferredWorkspaceId;
  }
  if (workspaces.some((workspace) => workspace.id === fallbackWorkspaceId)) {
    return fallbackWorkspaceId;
  }
  return workspaces[0]?.id ?? fallbackWorkspaceId;
}

function roleForWorkspace(
  memberships: WorkspaceMembership[],
  workspaceId: string,
): WorkspaceRole | null {
  return memberships.find((membership) => membership.workspaceId === workspaceId)?.role ?? null;
}

export interface WorkspaceStore {
  activeWorkspaceId: string;
  currentRole: WorkspaceRole | null;
  currentUser: AuthUser | null;
  invites: WorkspaceInvite[];
  isLoading: boolean;
  members: WorkspaceMember[];
  memberships: WorkspaceMembership[];
  pendingInvites: WorkspaceInvite[];
  workspaces: Workspace[];
  acceptInvite: (inviteId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  inviteMember: (email: string, role: WorkspaceInviteRole) => Promise<void>;
  leaveWorkspace: (workspaceId: string) => Promise<void>;
  loadForUser: (user: AuthUser, preferredWorkspaceId?: string) => Promise<string>;
  loadWorkspaceDetails: (workspaceId?: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  renameWorkspace: (name: string) => Promise<void>;
  resetLocal: () => void;
  revokeInvite: (inviteId: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: WorkspaceRole) => Promise<void>;
}

/**
 * Creates the workspace store around a repository.
 * This store is the authoritative active-workspace owner; prompt/folder stores
 * mirror its id only as a repository target cache.
 */
export function createWorkspaceStore(repo: IWorkspaceRepository) {
  return create<WorkspaceStore>((set, get) => ({
    activeWorkspaceId: 'local',
    currentRole: 'owner',
    currentUser: null,
    invites: [],
    isLoading: false,
    members: [LOCAL_MEMBER],
    memberships: [],
    pendingInvites: [],
    workspaces: [LOCAL_WORKSPACE],

    async loadForUser(user: AuthUser, preferredWorkspaceId?: string) {
      set({ isLoading: true, currentUser: user });
      try {
        await repo.bootstrapPersonalWorkspace(user);
        const [workspaces, memberships, pendingInvites] = await Promise.all([
          repo.listSyncedWorkspacesForUser(user.uid),
          repo.listMembershipsForUser(user.uid),
          repo.listPendingInvitesForEmail(user.email),
        ]);
        const activeWorkspaceId = chooseActiveWorkspace(
          workspaces,
          preferredWorkspaceId,
          user.uid,
        );

        set({
          activeWorkspaceId,
          currentRole: roleForWorkspace(memberships, activeWorkspaceId),
          isLoading: false,
          memberships,
          pendingInvites,
          workspaces,
        });
        await get().loadWorkspaceDetails(activeWorkspaceId);
        return activeWorkspaceId;
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    async loadWorkspaceDetails(workspaceId = get().activeWorkspaceId) {
      const user = get().currentUser;
      if (!user || workspaceId === 'local') return;
      const currentRole = roleForWorkspace(get().memberships, workspaceId);

      const [members, invites] = await Promise.all([
        repo.listMembers(workspaceId),
        currentRole === 'owner' ? repo.listInvites(workspaceId) : Promise.resolve([]),
      ]);

      set({
        members,
        invites,
        currentRole,
      });
    },

    async switchWorkspace(workspaceId: string) {
      const { memberships, workspaces } = get();
      if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      set({
        activeWorkspaceId: workspaceId,
        currentRole: roleForWorkspace(memberships, workspaceId),
      });
      await get().loadWorkspaceDetails(workspaceId);
    },

    async createWorkspace(name: string) {
      const user = get().currentUser;
      if (!user) throw new Error('Sign in to create a workspace.');

      const { membership, workspace } = await repo.createSyncedWorkspace(name, user);
      set((state) => ({
        activeWorkspaceId: workspace.id,
        currentRole: 'owner',
        memberships: [...state.memberships, membership],
        workspaces: [...state.workspaces, workspace],
      }));
      await get().loadWorkspaceDetails(workspace.id);
      return workspace;
    },

    async deleteWorkspace(workspaceId: string) {
      const { currentUser, workspaces } = get();
      if (!currentUser) throw new Error('Sign in to delete a workspace.');

      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
      if (workspace.ownerId !== currentUser.uid) {
        throw new Error('Only workspace owners can delete a workspace.');
      }
      if (workspace.id === currentUser.uid) {
        throw new Error('Personal Workspace cannot be deleted.');
      }

      await repo.deleteSyncedWorkspace(workspaceId);

      const wasActive = get().activeWorkspaceId === workspaceId;
      set((state) => {
        const nextWorkspaces = state.workspaces.filter((item) => item.id !== workspaceId);
        const nextMemberships = state.memberships.filter((item) => item.workspaceId !== workspaceId);
        const nextActiveWorkspaceId = wasActive
          ? chooseActiveWorkspace(nextWorkspaces, undefined, currentUser.uid)
          : state.activeWorkspaceId;

        return {
          activeWorkspaceId: nextActiveWorkspaceId,
          currentRole: roleForWorkspace(nextMemberships, nextActiveWorkspaceId),
          invites: wasActive ? [] : state.invites,
          members: wasActive ? [] : state.members,
          memberships: nextMemberships,
          workspaces: nextWorkspaces,
        };
      });

      if (wasActive && get().workspaces.some((item) => item.id === get().activeWorkspaceId)) {
        await get().loadWorkspaceDetails();
      }
    },

    async leaveWorkspace(workspaceId: string) {
      const { currentUser, memberships, workspaces } = get();
      if (!currentUser) throw new Error('Sign in to leave a workspace.');

      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const membership = memberships.find((item) => item.workspaceId === workspaceId);
      if (!membership) throw new Error(`Workspace membership not found: ${workspaceId}`);
      if (membership.role === 'owner') {
        throw new Error('Owners must delete their workspace instead of leaving it.');
      }

      await repo.leaveSyncedWorkspace(workspaceId, currentUser.uid);

      const wasActive = get().activeWorkspaceId === workspaceId;
      set((state) => {
        const nextWorkspaces = state.workspaces.filter((item) => item.id !== workspaceId);
        const nextMemberships = state.memberships.filter((item) => item.workspaceId !== workspaceId);
        const nextActiveWorkspaceId = wasActive
          ? chooseActiveWorkspace(nextWorkspaces, undefined, currentUser.uid)
          : state.activeWorkspaceId;

        return {
          activeWorkspaceId: nextActiveWorkspaceId,
          currentRole: roleForWorkspace(nextMemberships, nextActiveWorkspaceId),
          invites: wasActive ? [] : state.invites,
          members: wasActive ? [] : state.members,
          memberships: nextMemberships,
          workspaces: nextWorkspaces,
        };
      });

      if (wasActive && get().workspaces.some((item) => item.id === get().activeWorkspaceId)) {
        await get().loadWorkspaceDetails();
      }
    },

    async renameWorkspace(name: string) {
      const { activeWorkspaceId, currentRole } = get();
      if (currentRole !== 'owner') {
        throw new Error('Only workspace owners can rename a workspace.');
      }

      const updated = activeWorkspaceId === 'local'
        ? await repo.update(activeWorkspaceId, { name: name.trim() })
        : await repo.updateSyncedWorkspace(activeWorkspaceId, { name: name.trim() });
      set((state) => ({
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === updated.id ? updated : workspace,
        ),
      }));
    },

    async inviteMember(email: string, role: WorkspaceInviteRole) {
      const { activeWorkspaceId, currentRole, currentUser, workspaces } = get();
      if (!currentUser) throw new Error('Sign in to invite members.');
      if (currentRole !== 'owner') {
        throw new Error('Only workspace owners can invite members.');
      }

      const workspace = workspaces.find((item) => item.id === activeWorkspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${activeWorkspaceId}`);

      const invite = await repo.createInvite(workspace, email, role, currentUser.uid);
      set((state) => ({
        invites: state.invites.some((item) => item.id === invite.id)
          ? state.invites
          : [...state.invites, invite],
      }));
    },

    async revokeInvite(inviteId: string) {
      await repo.revokeInvite(inviteId);
      set((state) => ({
        invites: state.invites.filter((invite) => invite.id !== inviteId),
      }));
    },

    async acceptInvite(inviteId: string) {
      const user = get().currentUser;
      if (!user) throw new Error('Sign in to accept workspace invites.');

      const invite = get().pendingInvites.find((item) => item.id === inviteId);
      if (!invite) throw new Error(`Invite not found: ${inviteId}`);

      await repo.acceptInvite(invite, user);
      await get().loadForUser(user, invite.workspaceId);
    },

    async updateMemberRole(userId: string, role: WorkspaceRole) {
      const { activeWorkspaceId, currentUser } = get();
      if (userId === currentUser?.uid && role !== 'owner') {
        throw new Error('Owners cannot demote themselves.');
      }

      const member = await repo.updateMemberRole(activeWorkspaceId, userId, role);
      set((state) => ({
        members: state.members.map((item) => (item.userId === userId ? member : item)),
        memberships: state.memberships.map((membership) =>
          membership.workspaceId === activeWorkspaceId && membership.userId === userId
            ? { ...membership, role }
            : membership,
        ),
      }));
    },

    async removeMember(userId: string) {
      const { activeWorkspaceId, currentUser } = get();
      if (userId === currentUser?.uid) {
        throw new Error('Owners cannot remove themselves.');
      }

      await repo.removeMember(activeWorkspaceId, userId);
      set((state) => ({
        members: state.members.filter((member) => member.userId !== userId),
      }));
    },

    resetLocal() {
      set({
        activeWorkspaceId: 'local',
        currentRole: 'owner',
        currentUser: null,
        invites: [],
        isLoading: false,
        members: [LOCAL_MEMBER],
        memberships: [],
        pendingInvites: [],
        workspaces: [LOCAL_WORKSPACE],
      });
    },
  }));
}

interface WorkspaceStoreHotData {
  workspaceStore?: StoreApi<WorkspaceStore> | null;
}

const hotData = import.meta.hot?.data as WorkspaceStoreHotData | undefined;
let _store: StoreApi<WorkspaceStore> | null = hotData?.workspaceStore ?? null;

if (import.meta.hot) {
  import.meta.hot.dispose((data: WorkspaceStoreHotData) => {
    data.workspaceStore = _store;
  });
}

function createTestWorkspaceRepository(): IWorkspaceRepository {
  return {
    create: async () => LOCAL_WORKSPACE,
    getById: async (id) => (id === LOCAL_WORKSPACE.id ? LOCAL_WORKSPACE : null),
    listForUser: async () => [LOCAL_WORKSPACE],
    listSyncedWorkspacesForUser: async () => [LOCAL_WORKSPACE],
    update: async (_id, changes) => ({ ...LOCAL_WORKSPACE, ...changes }),
    updateSyncedWorkspace: async (_id, changes) => ({ ...LOCAL_WORKSPACE, ...changes }),
    bootstrapPersonalWorkspace: async () => LOCAL_WORKSPACE,
    listMembershipsForUser: async () => [],
    listPendingInvitesForEmail: async () => [],
    listMembers: async () => [LOCAL_MEMBER],
    listInvites: async () => [],
    createSyncedWorkspace: async () => ({
      workspace: LOCAL_WORKSPACE,
      membership: {
        id: 'local_local',
        workspaceId: 'local',
        userId: 'local',
        role: 'owner',
        email: '',
        displayName: null,
        workspaceName: LOCAL_WORKSPACE.name,
        ownerId: 'local',
        joinedAt: LOCAL_WORKSPACE.createdAt,
        updatedAt: LOCAL_WORKSPACE.updatedAt,
      },
    }),
    createInvite: async () => {
      throw new Error('Workspace invites are unavailable in local tests.');
    },
    acceptInvite: async () => LOCAL_MEMBER,
    deleteSyncedWorkspace: async () => {},
    leaveSyncedWorkspace: async () => {},
    updateMemberRole: async () => LOCAL_MEMBER,
    removeMember: async () => {},
    revokeInvite: async () => {},
  };
}

/** Initializes the singleton workspace store used by components. */
export function initWorkspaceStore(repo: IWorkspaceRepository): StoreApi<WorkspaceStore> {
  _store = createWorkspaceStore(repo);
  return _store;
}

/**
 * Reads the initialized workspace store, optionally through a selector.
 * Throws before initialization to avoid components using a missing repository.
 */
export function useWorkspaceStore(): WorkspaceStore;
export function useWorkspaceStore<T>(selector: (state: WorkspaceStore) => T): T;
export function useWorkspaceStore<T>(selector?: (state: WorkspaceStore) => T) {
  if (!_store && import.meta.env.MODE === 'test') {
    _store = createWorkspaceStore(createTestWorkspaceRepository());
  }
  if (!_store) {
    throw new Error(
      'WorkspaceStore has not been initialised. Call initWorkspaceStore(repo) before using useWorkspaceStore.',
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return selector ? useStore(_store, selector) : useStore(_store);
}
