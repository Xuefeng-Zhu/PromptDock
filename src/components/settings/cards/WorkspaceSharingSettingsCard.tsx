import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, LogOut, Plus, Trash2, UserPlus } from 'lucide-react';
import { useAppModeStore } from '../../../stores/app-mode-store';
import { canEditWorkspace, useWorkspaceStore } from '../../../stores/workspace-store';
import type { Workspace, WorkspaceMembership, WorkspaceRole } from '../../../types/index';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { WorkspaceColorMark } from '../../workspaces';
import { SettingsCardTitle } from './SettingsCardTitle';
import { InviteMemberDialog } from './InviteMemberDialog';

const MEMBER_ROLE_OPTIONS: WorkspaceRole[] = ['owner', 'editor', 'viewer'];

type WorkspaceRemovalIntent = {
  action: 'delete' | 'leave';
  workspace: Workspace;
};

function formatRole(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleBadgeClass(role: WorkspaceRole): string {
  if (role === 'owner') return 'bg-blue-50 text-blue-700';
  if (role === 'editor') return 'bg-teal-50 text-teal-700';
  return 'bg-gray-100 text-gray-600';
}

function roleForWorkspace(
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

export function WorkspaceSharingSettingsCard() {
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const acceptInvite = useWorkspaceStore((s) => s.acceptInvite);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const currentRole = useWorkspaceStore((s) => s.currentRole);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const inviteMember = useWorkspaceStore((s) => s.inviteMember);
  const invites = useWorkspaceStore((s) => s.invites);
  const members = useWorkspaceStore((s) => s.members);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const leaveWorkspace = useWorkspaceStore((s) => s.leaveWorkspace);
  const pendingInvites = useWorkspaceStore((s) => s.pendingInvites);
  const removeMember = useWorkspaceStore((s) => s.removeMember);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const revokeInvite = useWorkspaceStore((s) => s.revokeInvite);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const updateMemberRole = useWorkspaceStore((s) => s.updateMemberRole);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [removalIntent, setRemovalIntent] = useState<WorkspaceRemovalIntent | null>(null);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces],
  );
  const isOwner = currentRole === 'owner';
  const canEdit = mode === 'local' || canEditWorkspace(currentRole);
  const workspaceName = workspaceNameDraft;

  useEffect(() => {
    setWorkspaceNameDraft(activeWorkspace?.name ?? '');
  }, [activeWorkspace?.id, activeWorkspace?.name]);

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmWorkspaceRemoval = async () => {
    if (!removalIntent) return;

    setError(null);
    const intent = removalIntent;
    setRemovalIntent(null);

    try {
      if (intent.action === 'delete') {
        await deleteWorkspace(intent.workspace.id);
      } else {
        await leaveWorkspace(intent.workspace.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceName.trim() || workspaceName === activeWorkspace?.name) return;
    setError(null);
    try {
      await renameWorkspace(workspaceName);
      setWorkspaceNameDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSwitchWorkspace = async (workspaceId: Workspace['id']) => {
    if (workspaceId === activeWorkspaceId) return;
    setError(null);
    try {
      await switchWorkspace(workspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (mode === 'local') {
    return (
      <Card padding="lg">
        <SettingsCardTitle>Workspaces & Sharing</SettingsCardTitle>
        <p className="text-sm text-[var(--color-text-muted)]">
          Sign in to create shared workspaces and invite teammates. Local mode keeps your prompt library private on this device.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SettingsCardTitle>Workspaces & Sharing</SettingsCardTitle>
          <p className="-mt-2 text-xs text-[var(--color-text-muted)]">
            Manage access for the active synced workspace.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setInviteOpen(true)}
          disabled={!isOwner}
          title={!isOwner ? 'Only owners can invite members.' : undefined}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite member
        </Button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {pendingInvites.length > 0 && (
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
                <Button size="sm" variant="secondary" onClick={() => void acceptInvite(invite.id)}>
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  onClick={() => void handleSwitchWorkspace(workspace.id)}
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
                    onClick={() => setRemovalIntent({ action: 'delete', workspace })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
                {canLeaveWorkspace && (
                  <button
                    type="button"
                    className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)]"
                    onClick={() => setRemovalIntent({ action: 'leave', workspace })}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Leave
                  </button>
                )}
              </div>
            );
          })}

          {createOpen ? (
            <form className="space-y-2 border-t border-[var(--color-border)] p-3" onSubmit={handleCreateWorkspace}>
              <Input
                aria-label="New workspace name"
                placeholder="New workspace"
                value={newWorkspaceName}
                onChange={(event) => setNewWorkspaceName(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
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
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 text-[var(--color-text-muted)]" />
              New workspace
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label="Workspace name"
              value={workspaceName}
              onChange={(event) => setWorkspaceNameDraft(event.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRenameWorkspace}
                disabled={!workspaceName.trim() || workspaceName === activeWorkspace?.name}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    onChange={(event) =>
                      void updateMemberRole(member.userId, event.target.value as WorkspaceRole)
                    }
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
                  onClick={() => void removeMember(member.userId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>

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
                  onClick={() => void revokeInvite(invite.id)}
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {!canEdit && (
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Viewer access is read-only. You can still search, copy, and paste prompts.
        </p>
      )}

      {inviteOpen && (
        <InviteMemberDialog
          onCancel={() => setInviteOpen(false)}
          onInvite={inviteMember}
        />
      )}

      {removalIntent && (
        <WorkspaceRemovalDialog
          intent={removalIntent}
          onCancel={() => setRemovalIntent(null)}
          onConfirm={handleConfirmWorkspaceRemoval}
        />
      )}
    </Card>
  );
}

function WorkspaceRemovalDialog({
  intent,
  onCancel,
  onConfirm,
}: {
  intent: WorkspaceRemovalIntent;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const isDelete = intent.action === 'delete';
  const title = isDelete
    ? `Delete "${intent.workspace.name}" workspace?`
    : `Leave "${intent.workspace.name}"?`;
  const description = isDelete
    ? 'This removes the workspace for everyone, including prompts, folders, members, and pending invites.'
    : 'You will lose access to this workspace unless an owner invites you again.';
  const actionLabel = isDelete ? 'Delete workspace' : 'Leave workspace';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
      role="presentation"
    >
      <div
        aria-describedby="workspace-removal-description"
        aria-labelledby="workspace-removal-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        role="dialog"
      >
        <h3
          className="text-base font-semibold text-[var(--color-text-main)]"
          id="workspace-removal-title"
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]"
          id="workspace-removal-description"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={() => {
              void onConfirm();
            }}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
