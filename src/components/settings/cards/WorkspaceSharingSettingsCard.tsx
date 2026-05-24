import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useAppModeStore } from '../../../stores/app-mode-store';
import { canEditWorkspace, useWorkspaceStore } from '../../../stores/workspace-store';
import type { Workspace } from '../../../types/index';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { SettingsCardTitle } from './SettingsCardTitle';
import { InviteMemberDialog } from './InviteMemberDialog';
import {
  DomainAccessSection,
  PendingInvitesSection,
  PendingWorkspaceInvitationsSection,
  WorkspaceListSection,
  WorkspaceMembersSection,
  WorkspaceRenameSection,
  type WorkspaceRemovalIntent,
} from './WorkspaceSharingSettingsSections';

function formatActionError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function WorkspaceSharingSettingsCard() {
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const acceptDomainInvite = useWorkspaceStore((s) => s.acceptDomainInvite);
  const acceptInvite = useWorkspaceStore((s) => s.acceptInvite);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createDomainInvite = useWorkspaceStore((s) => s.createDomainInvite);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const currentRole = useWorkspaceStore((s) => s.currentRole);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const domainInvites = useWorkspaceStore((s) => s.domainInvites);
  const inviteMember = useWorkspaceStore((s) => s.inviteMember);
  const invites = useWorkspaceStore((s) => s.invites);
  const members = useWorkspaceStore((s) => s.members);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const leaveWorkspace = useWorkspaceStore((s) => s.leaveWorkspace);
  const pendingDomainInvites = useWorkspaceStore((s) => s.pendingDomainInvites);
  const pendingInvites = useWorkspaceStore((s) => s.pendingInvites);
  const removeMember = useWorkspaceStore((s) => s.removeMember);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const revokeDomainInvite = useWorkspaceStore((s) => s.revokeDomainInvite);
  const revokeInvite = useWorkspaceStore((s) => s.revokeInvite);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const updateMemberRole = useWorkspaceStore((s) => s.updateMemberRole);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [removalIntent, setRemovalIntent] = useState<WorkspaceRemovalIntent | null>(null);
  const [submittingDomain, setSubmittingDomain] = useState(false);
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
      setError(formatActionError(err));
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
      setError(formatActionError(err));
    }
  };

  const handleCreateDomainInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newDomain.trim()) return;

    setError(null);
    setSubmittingDomain(true);
    try {
      await createDomainInvite(newDomain);
      setNewDomain('');
    } catch (err) {
      setError(formatActionError(err));
    } finally {
      setSubmittingDomain(false);
    }
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceName.trim() || workspaceName === activeWorkspace?.name) return;
    setError(null);
    try {
      await renameWorkspace(workspaceName);
      setWorkspaceNameDraft('');
    } catch (err) {
      setError(formatActionError(err));
    }
  };

  const handleSwitchWorkspace = async (workspaceId: Workspace['id']) => {
    if (workspaceId === activeWorkspaceId) return;
    setError(null);
    try {
      await switchWorkspace(workspaceId);
    } catch (err) {
      setError(formatActionError(err));
    }
  };

  const runWorkspaceAction = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(formatActionError(err));
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

      <PendingWorkspaceInvitationsSection
        pendingDomainInvites={pendingDomainInvites}
        pendingInvites={pendingInvites}
        onAcceptDomainInvite={(inviteId) => {
          void runWorkspaceAction(() => acceptDomainInvite(inviteId));
        }}
        onAcceptInvite={(inviteId) => {
          void runWorkspaceAction(() => acceptInvite(inviteId));
        }}
      />

      <WorkspaceListSection
        activeWorkspaceId={activeWorkspaceId}
        createOpen={createOpen}
        memberships={memberships}
        newWorkspaceName={newWorkspaceName}
        userId={userId}
        workspaces={workspaces}
        onCancelCreate={() => setCreateOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
        onNewWorkspaceNameChange={setNewWorkspaceName}
        onOpenCreate={() => setCreateOpen(true)}
        onRemoveWorkspace={setRemovalIntent}
        onSwitchWorkspace={(workspaceId) => {
          void handleSwitchWorkspace(workspaceId);
        }}
      />

      {isOwner && (
        <WorkspaceRenameSection
          activeWorkspace={activeWorkspace}
          workspaceName={workspaceName}
          onRenameWorkspace={() => {
            void handleRenameWorkspace();
          }}
          onWorkspaceNameChange={setWorkspaceNameDraft}
        />
      )}

      {isOwner && (
        <DomainAccessSection
          domainInvites={domainInvites}
          newDomain={newDomain}
          submittingDomain={submittingDomain}
          onCreateDomainInvite={handleCreateDomainInvite}
          onNewDomainChange={setNewDomain}
          onRevokeDomainInvite={(inviteId) => {
            void runWorkspaceAction(() => revokeDomainInvite(inviteId));
          }}
        />
      )}

      <WorkspaceMembersSection
        isOwner={isOwner}
        members={members}
        userId={userId}
        onRemoveMember={(memberUserId) => {
          void runWorkspaceAction(() => removeMember(memberUserId));
        }}
        onUpdateMemberRole={(memberUserId, role) => {
          void runWorkspaceAction(() => updateMemberRole(memberUserId, role));
        }}
      />

      <PendingInvitesSection
        invites={invites}
        isOwner={isOwner}
        onRevokeInvite={(inviteId) => {
          void runWorkspaceAction(() => revokeInvite(inviteId));
        }}
      />

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
