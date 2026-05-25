import type { WorkspaceMembership, WorkspaceRole } from '../types/index';

export function formatWorkspaceRole(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatNullableWorkspaceRole(
  role: WorkspaceRole | null,
  fallback = 'Member',
): string {
  return role ? formatWorkspaceRole(role) : fallback;
}

export function getWorkspaceRole(
  memberships: WorkspaceMembership[],
  workspaceId: string,
): WorkspaceRole | null {
  return memberships.find((membership) => membership.workspaceId === workspaceId)?.role ?? null;
}

export function workspaceRoleBadgeClass(role: WorkspaceRole): string {
  if (role === 'owner') return 'bg-blue-50 text-blue-700';
  if (role === 'editor') return 'bg-teal-50 text-teal-700';
  return 'bg-gray-100 text-gray-600';
}
