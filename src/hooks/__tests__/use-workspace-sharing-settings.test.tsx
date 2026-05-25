// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormEvent } from 'react';
import type { IWorkspaceRepository } from '../../repositories/interfaces';
import { initAppModeStore } from '../../stores/app-mode-store';
import { initWorkspaceStore } from '../../stores/workspace-store';
import type {
  AuthUser,
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMembership,
} from '../../types/index';
import { useWorkspaceSharingSettings } from '../use-workspace-sharing-settings';

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

function submitEvent(): FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

function createRepo(overrides: Partial<IWorkspaceRepository> = {}): IWorkspaceRepository {
  const memberships = [
    membershipFor(personalWorkspace, 'owner'),
    membershipFor(teamWorkspace, 'owner'),
  ];

  return {
    create: vi.fn(async () => personalWorkspace),
    getById: vi.fn(async () => personalWorkspace),
    listForUser: vi.fn(async () => [personalWorkspace]),
    listSyncedWorkspacesForUser: vi.fn(async () => [personalWorkspace, teamWorkspace]),
    update: vi.fn(async (_id, changes) => ({ ...personalWorkspace, ...changes })),
    updateSyncedWorkspace: vi.fn(async (_id, changes) => ({ ...personalWorkspace, ...changes })),
    bootstrapPersonalWorkspace: vi.fn(async () => personalWorkspace),
    listMembershipsForUser: vi.fn(async () => memberships),
    listPendingDomainInvitesForEmail: vi.fn(async () => [] as WorkspaceDomainInvite[]),
    listPendingInvitesForEmail: vi.fn(async () => [] as WorkspaceInvite[]),
    listDomainInvites: vi.fn(async () => [] as WorkspaceDomainInvite[]),
    listMembers: vi.fn(async (workspaceId) => [
      memberFor(workspaceId === teamWorkspace.id ? teamWorkspace : personalWorkspace, 'owner'),
    ]),
    listInvites: vi.fn(async () => [] as WorkspaceInvite[]),
    createSyncedWorkspace: vi.fn(async (name) => {
      const workspace = {
        id: 'created-workspace',
        name,
        ownerId: user.uid,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      };
      return { workspace, membership: membershipFor(workspace, 'owner') };
    }),
    createInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    createDomainInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    acceptInvite: vi.fn(async () => memberFor(teamWorkspace, 'viewer')),
    acceptDomainInvite: vi.fn(async () => memberFor(teamWorkspace, 'viewer')),
    deleteSyncedWorkspace: vi.fn(async () => {}),
    leaveSyncedWorkspace: vi.fn(async () => {}),
    updateMemberRole: vi.fn(async (_workspaceId, memberUserId, role) => ({
      ...memberFor(teamWorkspace, role),
      userId: memberUserId,
    })),
    removeMember: vi.fn(async () => {}),
    revokeDomainInvite: vi.fn(async () => {}),
    revokeInvite: vi.fn(async () => {}),
    ...overrides,
  };
}

function setupStores(repo: IWorkspaceRepository = createRepo()) {
  const appModeStore = initAppModeStore();
  const workspaceStore = initWorkspaceStore(repo);
  appModeStore.getState().setUser(user);
  appModeStore.getState().setMode('synced');
  workspaceStore.setState({
    activeWorkspaceId: personalWorkspace.id,
    currentRole: 'owner',
    currentUser: user,
    members: [memberFor(personalWorkspace, 'owner')],
    memberships: [membershipFor(personalWorkspace, 'owner'), membershipFor(teamWorkspace, 'owner')],
    workspaces: [personalWorkspace, teamWorkspace],
  });
  return { appModeStore, workspaceStore };
}

describe('useWorkspaceSharingSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a workspace and resets the create form state', async () => {
    const repo = createRepo();
    setupStores(repo);
    const { result } = renderHook(() => useWorkspaceSharingSettings());

    act(() => {
      result.current.setCreateOpen(true);
      result.current.setNewWorkspaceName('Research');
    });

    await act(async () => {
      await result.current.handleCreateWorkspace(submitEvent());
    });

    expect(repo.createSyncedWorkspace).toHaveBeenCalledWith('Research', user);
    expect(result.current.createOpen).toBe(false);
    expect(result.current.newWorkspaceName).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('maps workspace action failures to the shared settings error', async () => {
    const repo = createRepo({
      listMembers: vi.fn(async () => {
        throw new Error('members unavailable');
      }),
    });
    setupStores(repo);
    const { result } = renderHook(() => useWorkspaceSharingSettings());

    await act(async () => {
      await result.current.handleSwitchWorkspace(teamWorkspace.id);
    });

    expect(result.current.error).toBe('members unavailable');
  });

  it('ignores repeated pending invite accept actions', async () => {
    const invite: WorkspaceInvite = {
      id: 'invite-1',
      workspaceId: teamWorkspace.id,
      workspaceName: teamWorkspace.name,
      email: user.email,
      role: 'viewer',
      status: 'pending',
      invitedBy: 'owner-1',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
      acceptedAt: null,
      acceptedBy: null,
    };
    const acceptGate = createDeferred<WorkspaceMember>();
    const repo = createRepo({
      acceptInvite: vi.fn(async () => {
        await acceptGate.promise;
        return memberFor(teamWorkspace, 'viewer');
      }),
    });
    const { workspaceStore } = setupStores(repo);
    workspaceStore.setState({ pendingInvites: [invite] });
    const { result } = renderHook(() => useWorkspaceSharingSettings());

    await act(async () => {
      result.current.handleAcceptInvite(invite.id);
      result.current.handleAcceptInvite(invite.id);
      await Promise.resolve();
    });

    expect(repo.acceptInvite).toHaveBeenCalledTimes(1);
    expect(result.current.isAcceptingInvite(invite.id)).toBe(true);

    await act(async () => {
      acceptGate.resolve(memberFor(teamWorkspace, 'viewer'));
    });

    await waitFor(() => {
      expect(result.current.isAcceptingInvite(invite.id)).toBe(false);
    });
  });

  it('ignores repeated member role updates while one is pending', async () => {
    const teammate: WorkspaceMember = {
      ...memberFor(personalWorkspace, 'editor'),
      id: 'member-2',
      userId: 'member-2',
      email: 'member@example.com',
      displayName: 'Member Two',
    };
    const updateGate = createDeferred<WorkspaceMember>();
    const repo = createRepo({
      updateMemberRole: vi.fn(async () => {
        await updateGate.promise;
        return { ...teammate, role: 'viewer' as const };
      }),
    });
    const { workspaceStore } = setupStores(repo);
    workspaceStore.setState({
      members: [memberFor(personalWorkspace, 'owner'), teammate],
    });
    const { result } = renderHook(() => useWorkspaceSharingSettings());

    await act(async () => {
      result.current.handleUpdateMemberRole(teammate.userId, 'viewer');
      result.current.handleUpdateMemberRole(teammate.userId, 'viewer');
      await Promise.resolve();
    });

    expect(repo.updateMemberRole).toHaveBeenCalledTimes(1);
    expect(result.current.isUpdatingMemberRole(teammate.userId)).toBe(true);

    await act(async () => {
      updateGate.resolve({ ...teammate, role: 'viewer' as const });
    });

    await waitFor(() => {
      expect(result.current.isUpdatingMemberRole(teammate.userId)).toBe(false);
    });
  });

  it('keeps the workspace name draft in sync with the active workspace', () => {
    const { workspaceStore } = setupStores();
    const { result } = renderHook(() => useWorkspaceSharingSettings());

    expect(result.current.workspaceName).toBe(personalWorkspace.name);

    act(() => {
      workspaceStore.setState({
        activeWorkspaceId: teamWorkspace.id,
        currentRole: 'owner',
      });
    });

    expect(result.current.workspaceName).toBe(teamWorkspace.name);
  });
});
