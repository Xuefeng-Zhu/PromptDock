import type {
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceDomainInviteStatus,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceInviteStatus,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';
import { timestampToDate, type FirestoreTimestamp } from './firestore-timestamps';

export interface FirestoreWorkspaceDoc {
  name: string;
  ownerId: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface FirestoreWorkspaceMemberDoc {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  email?: string;
  displayName?: string | null;
  joinedAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  acceptedInviteId?: string;
  acceptedDomainInviteId?: string;
}

export interface FirestoreWorkspaceMembershipDoc {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  email?: string;
  displayName?: string | null;
  workspaceName?: string;
  ownerId?: string;
  joinedAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  acceptedInviteId?: string;
  acceptedDomainInviteId?: string;
}

export interface FirestoreWorkspaceInviteDoc {
  workspaceId: string;
  workspaceName?: string;
  email: string;
  role: WorkspaceInviteRole;
  status: WorkspaceInviteStatus;
  invitedBy: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp | null;
  acceptedBy?: string | null;
}

export interface FirestoreWorkspaceDomainInviteDoc {
  workspaceId: string;
  workspaceName?: string;
  ownerId?: string;
  domain: string;
  role: 'viewer';
  status: WorkspaceDomainInviteStatus;
  invitedBy: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  revokedAt?: FirestoreTimestamp | null;
  revokedBy?: string | null;
}

export function toWorkspace(id: string, data: FirestoreWorkspaceDoc): Workspace {
  return {
    id,
    name: data.name,
    ownerId: data.ownerId,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

export function toWorkspaceMember(id: string, data: FirestoreWorkspaceMemberDoc): WorkspaceMember {
  return {
    id: data.id ?? id,
    workspaceId: data.workspaceId,
    userId: data.userId,
    role: data.role,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    joinedAt: timestampToDate(data.joinedAt),
    updatedAt: timestampToDate(data.updatedAt),
    ...(data.acceptedInviteId ? { acceptedInviteId: data.acceptedInviteId } : {}),
    ...(data.acceptedDomainInviteId ? { acceptedDomainInviteId: data.acceptedDomainInviteId } : {}),
  };
}

export function toWorkspaceMembership(
  id: string,
  data: FirestoreWorkspaceMembershipDoc,
): WorkspaceMembership {
  return {
    id: data.id ?? id,
    workspaceId: data.workspaceId,
    userId: data.userId,
    role: data.role,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    workspaceName: data.workspaceName ?? 'Workspace',
    ownerId: data.ownerId ?? '',
    joinedAt: timestampToDate(data.joinedAt),
    updatedAt: timestampToDate(data.updatedAt),
    ...(data.acceptedInviteId ? { acceptedInviteId: data.acceptedInviteId } : {}),
    ...(data.acceptedDomainInviteId ? { acceptedDomainInviteId: data.acceptedDomainInviteId } : {}),
  };
}

export function toWorkspaceInvite(id: string, data: FirestoreWorkspaceInviteDoc): WorkspaceInvite {
  return {
    id,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName ?? 'Workspace',
    email: data.email,
    role: data.role,
    status: data.status,
    invitedBy: data.invitedBy,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    acceptedAt: data.acceptedAt ? timestampToDate(data.acceptedAt) : null,
    acceptedBy: data.acceptedBy ?? null,
  };
}

export function toWorkspaceDomainInvite(
  id: string,
  data: FirestoreWorkspaceDomainInviteDoc,
): WorkspaceDomainInvite {
  return {
    id,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName ?? 'Workspace',
    ownerId: data.ownerId ?? '',
    domain: data.domain,
    role: 'viewer',
    status: data.status,
    invitedBy: data.invitedBy,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    revokedAt: data.revokedAt ? timestampToDate(data.revokedAt) : null,
    revokedBy: data.revokedBy ?? null,
  };
}
