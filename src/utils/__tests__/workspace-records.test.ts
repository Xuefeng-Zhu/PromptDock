import { describe, expect, it } from 'vitest';
import type { AuthUser, Workspace } from '../../types/index';
import {
  PERSONAL_WORKSPACE_NAME,
  createPersonalWorkspaceRecord,
  createWorkspaceMemberPayload,
  createWorkspaceMembershipPayload,
  normalizeWorkspaceEmail,
  workspaceMembershipId,
} from '../workspace-records';

const user: AuthUser = {
  uid: 'user-1',
  email: ' User@Example.COM ',
  displayName: 'User One',
};

const workspace: Workspace = {
  id: 'workspace-1',
  name: 'Design Team',
  ownerId: 'owner-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
};

describe('workspace record helpers', () => {
  it('builds deterministic workspace membership ids', () => {
    expect(workspaceMembershipId('workspace-1', 'user-1')).toBe('workspace-1_user-1');
  });

  it('normalizes workspace emails before writing membership records', () => {
    expect(normalizeWorkspaceEmail(' User@Example.COM ')).toBe('user@example.com');
  });

  it('creates personal workspace records with the shared default name', () => {
    const now = new Date('2024-01-01T00:00:00.000Z');

    expect(createPersonalWorkspaceRecord('user-1', now)).toEqual({
      id: 'user-1',
      name: PERSONAL_WORKSPACE_NAME,
      ownerId: 'user-1',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('builds member and membership payloads from the same base data', () => {
    const timestamp = 'server-timestamp';
    const memberPayload = createWorkspaceMemberPayload(workspace, user, 'editor', timestamp, {
      acceptedInviteId: 'invite-1',
    });
    const membershipPayload = createWorkspaceMembershipPayload(workspace, user, 'editor', timestamp, {
      acceptedInviteId: 'invite-1',
    });

    expect(memberPayload).toMatchObject({
      id: user.uid,
      workspaceId: workspace.id,
      userId: user.uid,
      role: 'editor',
      email: 'user@example.com',
      joinedAt: timestamp,
      updatedAt: timestamp,
      acceptedInviteId: 'invite-1',
    });
    expect(membershipPayload).toEqual({
      ...memberPayload,
      workspaceName: workspace.name,
      ownerId: workspace.ownerId,
    });
  });
});
