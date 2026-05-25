import { describe, expect, it } from 'vitest';
import {
  formatNullableWorkspaceRole,
  formatWorkspaceRole,
  getWorkspaceRole,
  workspaceRoleBadgeClass,
} from '../workspace-role';

describe('workspace role helpers', () => {
  it('formats workspace roles for display', () => {
    expect(formatWorkspaceRole('owner')).toBe('Owner');
    expect(formatWorkspaceRole('editor')).toBe('Editor');
    expect(formatWorkspaceRole('viewer')).toBe('Viewer');
  });

  it('formats nullable workspace roles with a fallback', () => {
    expect(formatNullableWorkspaceRole(null)).toBe('Member');
    expect(formatNullableWorkspaceRole(null, 'No access')).toBe('No access');
    expect(formatNullableWorkspaceRole('viewer')).toBe('Viewer');
  });

  it('finds the membership role for a workspace', () => {
    const joinedAt = new Date('2024-01-01T00:00:00.000Z');
    const memberships = [
      {
        id: 'workspace-1_user-1',
        workspaceId: 'workspace-1',
        userId: 'user-1',
        role: 'owner' as const,
        email: 'owner@example.com',
        displayName: 'Owner',
        workspaceName: 'Primary',
        ownerId: 'user-1',
        joinedAt,
        updatedAt: joinedAt,
      },
      {
        id: 'workspace-2_user-1',
        workspaceId: 'workspace-2',
        userId: 'user-1',
        role: 'viewer' as const,
        email: 'viewer@example.com',
        displayName: null,
        workspaceName: 'Shared',
        ownerId: 'owner-2',
        joinedAt,
        updatedAt: joinedAt,
      },
    ];

    expect(getWorkspaceRole(memberships, 'workspace-2')).toBe('viewer');
    expect(getWorkspaceRole(memberships, 'missing-workspace')).toBeNull();
  });

  it('returns stable badge classes by role', () => {
    expect(workspaceRoleBadgeClass('owner')).toContain('text-blue-700');
    expect(workspaceRoleBadgeClass('editor')).toContain('text-teal-700');
    expect(workspaceRoleBadgeClass('viewer')).toContain('text-gray-600');
  });
});
