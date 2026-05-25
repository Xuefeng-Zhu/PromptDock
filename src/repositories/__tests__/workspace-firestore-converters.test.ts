import { describe, expect, it } from 'vitest';
import {
  toWorkspace,
  toWorkspaceDomainInvite,
  toWorkspaceInvite,
  toWorkspaceMember,
  toWorkspaceMembership,
} from '../workspace-firestore-converters';

const createdAt = {
  seconds: 1_704_067_200,
  nanoseconds: 123_000_000,
};

const updatedAt = {
  toDate: () => new Date('2024-01-02T03:04:05.006Z'),
  seconds: 0,
  nanoseconds: 0,
};

describe('workspace Firestore converters', () => {
  it('converts workspace metadata timestamps from plain and SDK-like values', () => {
    const workspace = toWorkspace('workspace-1', {
      name: 'Design Team',
      ownerId: 'owner-1',
      createdAt,
      updatedAt,
    });

    expect(workspace).toMatchObject({
      id: 'workspace-1',
      name: 'Design Team',
      ownerId: 'owner-1',
    });
    expect(workspace.createdAt.toISOString()).toBe('2024-01-01T00:00:00.123Z');
    expect(workspace.updatedAt.toISOString()).toBe('2024-01-02T03:04:05.006Z');
  });

  it('keeps member invite metadata while defaulting optional profile fields', () => {
    const member = toWorkspaceMember('member-doc', {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: 'viewer',
      joinedAt: createdAt,
      updatedAt,
      acceptedInviteId: 'invite-1',
    });

    expect(member).toMatchObject({
      id: 'member-doc',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: 'viewer',
      email: '',
      displayName: null,
      acceptedInviteId: 'invite-1',
    });
  });

  it('defaults membership workspace metadata from schemaless documents', () => {
    const membership = toWorkspaceMembership('workspace-1_user-1', {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: 'editor',
      joinedAt: createdAt,
      updatedAt,
      acceptedDomainInviteId: 'domain-invite-1',
    });

    expect(membership).toMatchObject({
      id: 'workspace-1_user-1',
      workspaceName: 'Workspace',
      ownerId: '',
      acceptedDomainInviteId: 'domain-invite-1',
    });
  });

  it('normalizes missing invite optional fields', () => {
    const invite = toWorkspaceInvite('invite-1', {
      workspaceId: 'workspace-1',
      email: 'person@example.com',
      role: 'viewer',
      status: 'pending',
      invitedBy: 'owner-1',
      createdAt,
      updatedAt,
    });

    expect(invite).toMatchObject({
      id: 'invite-1',
      workspaceName: 'Workspace',
      acceptedAt: null,
      acceptedBy: null,
    });
  });

  it('normalizes domain invite owner and revoke metadata', () => {
    const invite = toWorkspaceDomainInvite('workspace-1_example.com', {
      workspaceId: 'workspace-1',
      domain: 'example.com',
      role: 'viewer',
      status: 'active',
      invitedBy: 'owner-1',
      createdAt,
      updatedAt,
    });

    expect(invite).toMatchObject({
      id: 'workspace-1_example.com',
      workspaceName: 'Workspace',
      ownerId: '',
      revokedAt: null,
      revokedBy: null,
    });
  });
});
