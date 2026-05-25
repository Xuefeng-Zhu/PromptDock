import type { WorkspaceRole } from '../../../types/index';
import { formatWorkspaceRole, workspaceRoleBadgeClass } from '../../../utils/workspace-role';

export const MEMBER_ROLE_OPTIONS: WorkspaceRole[] = ['owner', 'editor', 'viewer'];

type WorkspaceRoleBadgeSize = 'compact' | 'standard';

const WORKSPACE_ROLE_BADGE_SIZE_CLASS: Record<WorkspaceRoleBadgeSize, string> = {
  compact: 'px-2 py-0.5 text-[10px]',
  standard: 'px-2 py-1 text-xs',
};

export function WorkspaceRoleBadge({
  className = '',
  role,
  size = 'compact',
}: {
  className?: string;
  role: WorkspaceRole | null;
  size?: WorkspaceRoleBadgeSize;
}) {
  if (!role) return null;

  return (
    <span
      className={[
        'rounded-full font-medium',
        WORKSPACE_ROLE_BADGE_SIZE_CLASS[size],
        workspaceRoleBadgeClass(role),
        className,
      ].filter(Boolean).join(' ')}
    >
      {formatWorkspaceRole(role)}
    </span>
  );
}
