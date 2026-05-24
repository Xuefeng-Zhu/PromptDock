import { describe, expect, it } from 'vitest';
import {
  formatNullableWorkspaceRole,
  formatWorkspaceRole,
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

  it('returns stable badge classes by role', () => {
    expect(workspaceRoleBadgeClass('owner')).toContain('text-blue-700');
    expect(workspaceRoleBadgeClass('editor')).toContain('text-teal-700');
    expect(workspaceRoleBadgeClass('viewer')).toContain('text-gray-600');
  });
});
