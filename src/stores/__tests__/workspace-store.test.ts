import { describe, expect, it, vi } from 'vitest';
import { createWorkspaceStore } from '../workspace-store';
import type { IWorkspaceRepository } from '../../repositories/interfaces';
import type {
  AuthUser,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMembership,
} from '../../types/index';

const user: AuthUser = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'User One',
};

const personalWorkspace: Workspace = {
  id: user.uid,
  name: 'Personal Workspace',
  ownerId: user.uid,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const teamWorkspace: Workspace = {
  id: 'team-1',
  name: 'Design Team',
  ownerId: user.uid,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

function membershipFor(workspace: Workspace, role: WorkspaceMembership['role']): WorkspaceMembership {
  return {
    id: `${workspace.id}_${user.uid}`,
    workspaceId: workspace.id,
    userId: user.uid,
    role,
    email: user.email,
    displayName: user.displayName,
    workspaceName: workspace.name,
    ownerId: workspace.ownerId,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

function memberFor(workspace: Workspace, role: WorkspaceMember['role']): WorkspaceMember {
  return {
    id: user.uid,
    workspaceId: workspace.id,
    userId: user.uid,
    role,
    email: user.email,
    displayName: user.displayName,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

function createRepo(overrides: Partial<IWorkspaceRepository> = {}): IWorkspaceRepository {
  const workspaces = [personalWorkspace, teamWorkspace];
  const memberships = [
    membershipFor(personalWorkspace, 'owner'),
    membershipFor(teamWorkspace, 'editor'),
  ];
  const invite: WorkspaceInvite = {
    id: 'invite-1',
    workspaceId: 'team-2',
    workspaceName: 'Marketing Ops',
    email: user.email,
    role: 'viewer',
    status: 'pending',
    invitedBy: 'owner-1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    acceptedAt: null,
    acceptedBy: null,
  };

  return {
    create: vi.fn(async () => personalWorkspace),
    getById: vi.fn(async () => personalWorkspace),
    listForUser: vi.fn(async () => [personalWorkspace]),
    listSyncedWorkspacesForUser: vi.fn(async () => workspaces),
    update: vi.fn(async (_id, changes) => ({ ...teamWorkspace, ...changes })),
    updateSyncedWorkspace: vi.fn(async (_id, changes) => ({ ...teamWorkspace, ...changes })),
    bootstrapPersonalWorkspace: vi.fn(async () => personalWorkspace),
    listMembershipsForUser: vi.fn(async () => memberships),
    listPendingInvitesForEmail: vi.fn(async () => [invite]),
    listMembers: vi.fn(async (workspaceId) => [
      memberFor(workspaces.find((workspace) => workspace.id === workspaceId) ?? personalWorkspace, 'owner'),
    ]),
    listInvites: vi.fn(async () => []),
    createSyncedWorkspace: vi.fn(async (name) => {
      const workspace = { ...teamWorkspace, id: 'created-workspace', name };
      return { workspace, membership: membershipFor(workspace, 'owner') };
    }),
    createInvite: vi.fn(async (workspace, email, role, invitedBy) => ({
      id: 'new-invite',
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      email,
      role,
      status: 'pending' as const,
      invitedBy,
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
      acceptedAt: null,
      acceptedBy: null,
    })),
    acceptInvite: vi.fn(async () => memberFor(teamWorkspace, 'viewer')),
    deleteSyncedWorkspace: vi.fn(async () => {}),
    leaveSyncedWorkspace: vi.fn(async () => {}),
    updateMemberRole: vi.fn(async (_workspaceId, memberUserId, role) => ({
      ...memberFor(teamWorkspace, role),
      userId: memberUserId,
    })),
    removeMember: vi.fn(async () => {}),
    revokeInvite: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('WorkspaceStore', () => {
  it('loads workspaces and honors a valid preferred active workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);

    const activeWorkspaceId = await store.getState().loadForUser(user, 'team-1');

    expect(activeWorkspaceId).toBe('team-1');
    expect(store.getState().activeWorkspaceId).toBe('team-1');
    expect(store.getState().currentRole).toBe('editor');
    expect(store.getState().workspaces).toHaveLength(2);
    expect(store.getState().pendingInvites).toHaveLength(1);
  });

  it('falls back to the personal workspace when the preferred workspace is invalid', async () => {
    const store = createWorkspaceStore(createRepo());

    const activeWorkspaceId = await store.getState().loadForUser(user, 'missing');

    expect(activeWorkspaceId).toBe(user.uid);
    expect(store.getState().currentRole).toBe('owner');
  });

  it('does not load outgoing invite management data for non-owner workspaces', async () => {
    const listInvites = vi.fn(async () => {
      throw new Error('Editors and viewers cannot list outgoing invites.');
    });
    const store = createWorkspaceStore(createRepo({ listInvites }));

    await store.getState().loadForUser(user, 'team-1');

    expect(listInvites).not.toHaveBeenCalled();
    expect(store.getState().invites).toEqual([]);
  });

  it('creates and activates a new workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);

    await store.getState().createWorkspace('Research');

    expect(repo.createSyncedWorkspace).toHaveBeenCalledWith('Research', user);
    expect(store.getState().activeWorkspaceId).toBe('created-workspace');
    expect(store.getState().currentRole).toBe('owner');
  });

  it('invites members only when the current user owns the workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);

    await store.getState().inviteMember('teammate@example.com', 'editor');

    expect(repo.createInvite).toHaveBeenCalledWith(
      personalWorkspace,
      'teammate@example.com',
      'editor',
      user.uid,
    );
    expect(store.getState().invites).toHaveLength(1);
  });

  it('rejects member invites for non-owner roles', async () => {
    const store = createWorkspaceStore(createRepo());
    await store.getState().loadForUser(user, 'team-1');

    await expect(
      store.getState().inviteMember('teammate@example.com', 'viewer'),
    ).rejects.toThrow('Only workspace owners can invite members.');
  });

  it('accepts pending invites and reloads workspaces into the invited workspace', async () => {
    const invitedWorkspace: Workspace = {
      id: 'team-2',
      name: 'Marketing Ops',
      ownerId: 'owner-1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    };
    let accepted = false;
    const repo = createRepo({
      acceptInvite: vi.fn(async () => {
        accepted = true;
        return memberFor(invitedWorkspace, 'viewer');
      }),
      listSyncedWorkspacesForUser: vi.fn(async () =>
        accepted ? [personalWorkspace, invitedWorkspace] : [personalWorkspace, teamWorkspace],
      ),
      listMembershipsForUser: vi.fn(async () =>
        accepted
          ? [membershipFor(personalWorkspace, 'owner'), membershipFor(invitedWorkspace, 'viewer')]
          : [membershipFor(personalWorkspace, 'owner'), membershipFor(teamWorkspace, 'editor')],
      ),
    });
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);

    await store.getState().acceptInvite('invite-1');

    expect(repo.acceptInvite).toHaveBeenCalled();
    expect(store.getState().activeWorkspaceId).toBe('team-2');
  });

  it('updates and removes members in the active workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);

    await store.getState().updateMemberRole('member-2', 'viewer');
    await store.getState().removeMember('member-2');

    expect(repo.updateMemberRole).toHaveBeenCalledWith(user.uid, 'member-2', 'viewer');
    expect(repo.removeMember).toHaveBeenCalledWith(user.uid, 'member-2');
  });

  it('deletes an owned non-personal workspace and falls back to personal workspace', async () => {
    const ownedTeamWorkspace: Workspace = {
      ...teamWorkspace,
      ownerId: user.uid,
    };
    const repo = createRepo({
      listSyncedWorkspacesForUser: vi.fn(async () => [personalWorkspace, ownedTeamWorkspace]),
      listMembershipsForUser: vi.fn(async () => [
        membershipFor(personalWorkspace, 'owner'),
        membershipFor(ownedTeamWorkspace, 'owner'),
      ]),
    });
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user, ownedTeamWorkspace.id);

    await store.getState().deleteWorkspace(ownedTeamWorkspace.id);

    expect(repo.deleteSyncedWorkspace).toHaveBeenCalledWith(ownedTeamWorkspace.id);
    expect(store.getState().workspaces.map((workspace) => workspace.id)).toEqual([personalWorkspace.id]);
    expect(store.getState().activeWorkspaceId).toBe(personalWorkspace.id);
    expect(store.getState().currentRole).toBe('owner');
  });

  it('does not delete the protected personal workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);

    await expect(store.getState().deleteWorkspace(personalWorkspace.id)).rejects.toThrow(
      'Personal Workspace cannot be deleted.',
    );
    expect(repo.deleteSyncedWorkspace).not.toHaveBeenCalled();
  });

  it('leaves a shared workspace and falls back to personal workspace', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user, teamWorkspace.id);

    await store.getState().leaveWorkspace(teamWorkspace.id);

    expect(repo.leaveSyncedWorkspace).toHaveBeenCalledWith(teamWorkspace.id, user.uid);
    expect(store.getState().workspaces.map((workspace) => workspace.id)).toEqual([personalWorkspace.id]);
    expect(store.getState().activeWorkspaceId).toBe(personalWorkspace.id);
    expect(store.getState().currentRole).toBe('owner');
  });

  it('does not leave an owned workspace', async () => {
    const ownedTeamWorkspace: Workspace = {
      ...teamWorkspace,
      ownerId: user.uid,
    };
    const repo = createRepo({
      listSyncedWorkspacesForUser: vi.fn(async () => [personalWorkspace, ownedTeamWorkspace]),
      listMembershipsForUser: vi.fn(async () => [
        membershipFor(personalWorkspace, 'owner'),
        membershipFor(ownedTeamWorkspace, 'owner'),
      ]),
    });
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user, ownedTeamWorkspace.id);

    await expect(store.getState().leaveWorkspace(ownedTeamWorkspace.id)).rejects.toThrow(
      'Owners must delete their workspace instead of leaving it.',
    );
    expect(repo.leaveSyncedWorkspace).not.toHaveBeenCalled();
  });

  it('revokes pending invites from state', async () => {
    const repo = createRepo();
    const store = createWorkspaceStore(repo);
    await store.getState().loadForUser(user);
    await store.getState().inviteMember('teammate@example.com', 'editor');

    await store.getState().revokeInvite('new-invite');

    expect(repo.revokeInvite).toHaveBeenCalledWith('new-invite');
    expect(store.getState().invites).toHaveLength(0);
  });
});
