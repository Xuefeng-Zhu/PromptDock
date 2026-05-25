import type { WorkspaceDomainInvite, WorkspaceInvite } from '../../../types/index';
import { formatWorkspaceRole, workspaceRoleBadgeClass } from '../../../utils/workspace-role';
import { Button } from '../../ui/Button';

export function PendingWorkspaceInvitationsSection({
  isAcceptingDomainInvite,
  isAcceptingInvite,
  onAcceptDomainInvite,
  onAcceptInvite,
  pendingDomainInvites,
  pendingInvites,
}: {
  isAcceptingDomainInvite: (inviteId: string) => boolean;
  isAcceptingInvite: (inviteId: string) => boolean;
  onAcceptDomainInvite: (inviteId: string) => void;
  onAcceptInvite: (inviteId: string) => void;
  pendingDomainInvites: WorkspaceDomainInvite[];
  pendingInvites: WorkspaceInvite[];
}) {
  if (pendingInvites.length === 0 && pendingDomainInvites.length === 0) return null;

  return (
    <div className="mb-5 border-b border-[var(--color-border)] pb-4">
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">
        Invitations for you
      </h4>
      <div className="mt-2 space-y-2">
        {pendingInvites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--color-text-main)]">
                {invite.workspaceName}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Invited as {formatWorkspaceRole(invite.role)}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={isAcceptingInvite(invite.id)}
              onClick={() => onAcceptInvite(invite.id)}
            >
              Accept
            </Button>
          </div>
        ))}
        {pendingDomainInvites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--color-text-main)]">
                {invite.workspaceName}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Domain access for @{invite.domain}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={isAcceptingDomainInvite(invite.id)}
              onClick={() => onAcceptDomainInvite(invite.id)}
            >
              Accept
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PendingInvitesSection({
  invites,
  isOwner,
  isRevokingInvite,
  onRevokeInvite,
}: {
  invites: WorkspaceInvite[];
  isOwner: boolean;
  isRevokingInvite: (inviteId: string) => boolean;
  onRevokeInvite: (inviteId: string) => void;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Pending invites</h4>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
        {invites.length === 0 ? (
          <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">
            No pending invites.
          </p>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 last:border-b-0"
            >
              <span className="truncate text-sm text-[var(--color-text-main)]">{invite.email}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${workspaceRoleBadgeClass(invite.role)}`}>
                {formatWorkspaceRole(invite.role)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!isOwner || isRevokingInvite(invite.id)}
                onClick={() => onRevokeInvite(invite.id)}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
