import type {
  AuthUser,
  Workspace,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';

export const PERSONAL_WORKSPACE_NAME = 'Personal Workspace';

export interface AcceptedWorkspaceMetadata {
  acceptedInviteId?: string;
  acceptedDomainInviteId?: string;
}

export function workspaceMembershipId(workspaceId: string, userId: string): string {
  return `${workspaceId}_${userId}`;
}

export function normalizeWorkspaceEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createPersonalWorkspaceRecord(userId: string, now = new Date()): Workspace {
  return {
    id: userId,
    name: PERSONAL_WORKSPACE_NAME,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createWorkspaceMemberPayload(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceRole,
  timestamp: unknown,
  acceptedMetadata: AcceptedWorkspaceMetadata = {},
): Omit<WorkspaceMember, 'joinedAt' | 'updatedAt'> & {
  joinedAt: unknown;
  updatedAt: unknown;
} {
  return {
    id: user.uid,
    workspaceId: workspace.id,
    userId: user.uid,
    role,
    email: normalizeWorkspaceEmail(user.email),
    displayName: user.displayName,
    joinedAt: timestamp,
    updatedAt: timestamp,
    ...(acceptedMetadata.acceptedInviteId
      ? { acceptedInviteId: acceptedMetadata.acceptedInviteId }
      : {}),
    ...(acceptedMetadata.acceptedDomainInviteId
      ? { acceptedDomainInviteId: acceptedMetadata.acceptedDomainInviteId }
      : {}),
  };
}

export function createWorkspaceMembershipPayload(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceRole,
  timestamp: unknown,
  acceptedMetadata: AcceptedWorkspaceMetadata = {},
): Omit<WorkspaceMembership, 'joinedAt' | 'updatedAt'> & {
  joinedAt: unknown;
  updatedAt: unknown;
} {
  return {
    ...createWorkspaceMemberPayload(workspace, user, role, timestamp, acceptedMetadata),
    workspaceName: workspace.name,
    ownerId: workspace.ownerId,
  };
}
