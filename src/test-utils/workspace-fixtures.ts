import type {
  AuthUser,
  Workspace,
  WorkspaceMember,
  WorkspaceMembership,
} from '../types/index';

export function makeTestAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    uid: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  };
}

export function makeTestWorkspace(
  user = makeTestAuthUser(),
  overrides: Partial<Workspace> = {},
): Workspace {
  const createdAt = new Date('2024-01-01');
  return {
    id: user.uid,
    name: 'Personal Workspace',
    ownerId: user.uid,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export function makeTestWorkspaceMembership(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceMembership['role'],
  overrides: Partial<WorkspaceMembership> = {},
): WorkspaceMembership {
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
    ...overrides,
  };
}

export function makeTestWorkspaceMember(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceMember['role'],
  overrides: Partial<WorkspaceMember> = {},
): WorkspaceMember {
  return {
    id: user.uid,
    workspaceId: workspace.id,
    userId: user.uid,
    role,
    email: user.email,
    displayName: user.displayName,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    ...overrides,
  };
}

export function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}
