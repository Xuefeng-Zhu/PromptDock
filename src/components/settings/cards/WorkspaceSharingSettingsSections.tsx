import type { FormEvent } from 'react';
import { Check, Globe2, LogOut, Plus, Trash2 } from 'lucide-react';
import type {
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../../../types/index';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { WorkspaceColorMark } from '../../workspaces';

export const MEMBER_ROLE_OPTIONS: WorkspaceRole[] = ['owner', 'editor', 'viewer'];

export type WorkspaceRemovalIntent = {
  action: 'delete' | 'leave';
  workspace: Workspace;
};

export function formatRole(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleBadgeClass(role: WorkspaceRole): string {
  if (role === 'owner') return 'bg-blue-50 text-blue-700';
  if (role === 'editor') return 'bg-teal-50 text-teal-700';
  return 'bg-gray-100 text-gray-600';
}

export function roleForWorkspace(
  memberships: WorkspaceMembership[],
  workspaceId: string,
): WorkspaceRole | null {
  return memberships.find((membership) => membership.workspaceId === workspaceId)?.role ?? null;
}

function WorkspaceRoleBadge({ role }: { role: WorkspaceRole | null }) {
  if (!role) return null;

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeClass(role)}`}>
      {formatRole(role)}
    </span>
  );
}

export function PendingWorkspaceInvitationsSection({
  onAcceptDomainInvite,
  onAcceptInvite,
  pendingDomainInvites,
  pendingInvites,
}: {
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
                Invited as {formatRole(invite.role)}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onAcceptInvite(invite.id)}>
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
            <Button size="sm" variant="secondary" onClick={() => onAcceptDomainInvite(invite.id)}>
              Accept
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceListSection({
  activeWorkspaceId,
  createOpen,
  memberships,
  newWorkspaceName,
  onCancelCreate,
  onCreateWorkspace,
  onNewWorkspaceNameChange,
  onOpenCreate,
  onRemoveWorkspace,
  onSwitchWorkspace,
  userId,
  workspaces,
}: {
  activeWorkspaceId: string;
  createOpen: boolean;
  memberships: WorkspaceMembership[];
  newWorkspaceName: string;
  onCancelCreate: () => void;
  onCreateWorkspace: (event: FormEvent<HTMLFormElement>) => void;
  onNewWorkspaceNameChange: (name: string) => void;
  onOpenCreate: () => void;
  onRemoveWorkspace: (intent: WorkspaceRemovalIntent) => void;
  onSwitchWorkspace: (workspaceId: Workspace['id']) => void;
  userId: string | null;
  workspaces: Workspace[];
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Workspaces</h4>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]">
        {workspaces.map((workspace) => {
          const selected = workspace.id === activeWorkspaceId;
          const role = roleForWorkspace(memberships, workspace.id);
          const isPersonalWorkspace = workspace.id === userId;
          const canDeleteWorkspace = role === 'owner' && workspace.ownerId === userId && !isPersonalWorkspace;
          const canLeaveWorkspace = role !== null && role !== 'owner';
          return (
            <div
              key={workspace.id}
              className={[
                'flex w-full items-center gap-2 border-b border-[var(--color-border)] text-sm transition-colors last:border-b-0',
                selected
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-main)] hover:bg-gray-50',
              ].join(' ')}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
                onClick={() => onSwitchWorkspace(workspace.id)}
              >
                <WorkspaceColorMark size="sm" workspace={workspace} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {workspace.name}
                </span>
                <WorkspaceRoleBadge role={role} />
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
              {canDeleteWorkspace && (
                <button
                  type="button"
                  className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  onClick={() => onRemoveWorkspace({ action: 'delete', workspace })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
              {canLeaveWorkspace && (
                <button
                  type="button"
                  className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)]"
                  onClick={() => onRemoveWorkspace({ action: 'leave', workspace })}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Leave
                </button>
              )}
            </div>
          );
        })}

        {createOpen ? (
          <form className="space-y-2 border-t border-[var(--color-border)] p-3" onSubmit={onCreateWorkspace}>
            <Input
              aria-label="New workspace name"
              placeholder="New workspace"
              value={newWorkspaceName}
              onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancelCreate}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newWorkspaceName.trim()}>
                Create
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2.5 text-left text-sm text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
            onClick={onOpenCreate}
          >
            <Plus className="h-4 w-4 text-[var(--color-text-muted)]" />
            New workspace
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkspaceRenameSection({
  activeWorkspace,
  onRenameWorkspace,
  onWorkspaceNameChange,
  workspaceName,
}: {
  activeWorkspace: Workspace | undefined;
  onRenameWorkspace: () => void;
  onWorkspaceNameChange: (name: string) => void;
  workspaceName: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          label="Workspace name"
          value={workspaceName}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
        />
        <div className="flex items-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRenameWorkspace}
            disabled={!workspaceName.trim() || workspaceName === activeWorkspace?.name}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DomainAccessSection({
  domainInvites,
  newDomain,
  onCreateDomainInvite,
  onNewDomainChange,
  onRevokeDomainInvite,
  submittingDomain,
}: {
  domainInvites: WorkspaceDomainInvite[];
  newDomain: string;
  onCreateDomainInvite: (event: FormEvent<HTMLFormElement>) => void;
  onNewDomainChange: (domain: string) => void;
  onRevokeDomainInvite: (inviteId: string) => void;
  submittingDomain: boolean;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Domain access</h4>
      <form className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onCreateDomainInvite}>
        <Input
          aria-label="Allowed email domain"
          placeholder="example.com"
          value={newDomain}
          onChange={(event) => onNewDomainChange(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={!newDomain.trim() || submittingDomain}
        >
          <Globe2 className="mr-1.5 h-4 w-4" />
          Add domain
        </Button>
      </form>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
        {domainInvites.length === 0 ? (
          <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">
            No domain access.
          </p>
        ) : (
          domainInvites.map((invite) => (
            <div
              key={invite.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 last:border-b-0"
            >
              <span className="truncate text-sm text-[var(--color-text-main)]">
                @{invite.domain}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleBadgeClass(invite.role)}`}>
                {formatRole(invite.role)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => onRevokeDomainInvite(invite.id)}>
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function WorkspaceMembersSection({
  isOwner,
  members,
  onRemoveMember,
  onUpdateMemberRole,
  userId,
}: {
  isOwner: boolean;
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
                  value={member.role}
                  onChange={(event) => onUpdateMemberRole(member.userId, event.target.value as WorkspaceRole)}
                >
                  {MEMBER_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{formatRole(role)}</option>
                  ))}
                </select>
              ) : (
                <span className={`self-center rounded-full px-2 py-1 text-xs font-medium ${roleBadgeClass(member.role)}`}>
                  {formatRole(member.role)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={!canManageMember}
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

export function PendingInvitesSection({
  invites,
  isOwner,
  onRevokeInvite,
}: {
  invites: WorkspaceInvite[];
  isOwner: boolean;
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
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleBadgeClass(invite.role)}`}>
                {formatRole(invite.role)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!isOwner}
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
