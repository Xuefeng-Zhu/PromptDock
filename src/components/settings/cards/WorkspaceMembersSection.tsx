import type { WorkspaceMember, WorkspaceRole } from '../../../types/index';
import { formatWorkspaceRole, workspaceRoleBadgeClass } from '../../../utils/workspace-role';
import { Button } from '../../ui/Button';
import { MEMBER_ROLE_OPTIONS } from './WorkspaceSharingRole';

export function WorkspaceMembersSection({
  isRemovingMember,
  isOwner,
  isUpdatingMemberRole,
  members,
  onRemoveMember,
  onUpdateMemberRole,
  userId,
}: {
  isRemovingMember: (userId: string) => boolean;
  isOwner: boolean;
  isUpdatingMemberRole: (userId: string) => boolean;
  members: WorkspaceMember[];
  onRemoveMember: (userId: string) => void;
  onUpdateMemberRole: (userId: string, role: WorkspaceRole) => void;
  userId: string | null;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Members</h4>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
        {members.map((member) => {
          const isSelf = member.userId === userId;
          const canManageMember = isOwner && !isSelf;
          const removingMember = isRemovingMember(member.userId);
          const updatingMemberRole = isUpdatingMemberRole(member.userId);
          return (
            <div
              key={member.userId}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--color-border)] px-3 py-2 last:border-b-0 sm:grid-cols-[1fr_8rem_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text-main)]">
                  {member.displayName || member.email || member.userId}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {member.email || member.userId}
                </p>
              </div>
              {canManageMember ? (
                <select
                  aria-label={`Role for ${member.email || member.userId}`}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1 text-xs text-[var(--color-text-main)]"
                  disabled={updatingMemberRole}
                  value={member.role}
                  onChange={(event) => onUpdateMemberRole(member.userId, event.target.value as WorkspaceRole)}
                >
                  {MEMBER_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{formatWorkspaceRole(role)}</option>
                  ))}
                </select>
              ) : (
                <span className={`self-center rounded-full px-2 py-1 text-xs font-medium ${workspaceRoleBadgeClass(member.role)}`}>
                  {formatWorkspaceRole(member.role)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={!canManageMember || removingMember}
                onClick={() => onRemoveMember(member.userId)}
              >
                Remove
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
