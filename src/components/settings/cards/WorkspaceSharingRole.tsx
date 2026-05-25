import type { WorkspaceRole } from '../../../types/index';
import { formatWorkspaceRole, workspaceRoleBadgeClass } from '../../../utils/workspace-role';

export const MEMBER_ROLE_OPTIONS: WorkspaceRole[] = ['owner', 'editor', 'viewer'];

export function WorkspaceRoleBadge({ role }: { role: WorkspaceRole | null }) {
  if (!role) return null;

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${workspaceRoleBadgeClass(role)}`}>
      {formatWorkspaceRole(role)}
    </span>
  );
}
