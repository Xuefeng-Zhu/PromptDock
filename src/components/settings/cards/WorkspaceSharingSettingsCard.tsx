import { UserPlus } from 'lucide-react';
import { useWorkspaceSharingSettings } from '../../../hooks/use-workspace-sharing-settings';
import type { WorkspaceRemovalIntent } from '../../../types/index';
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
} from './WorkspaceSharingSettingsSections';

export function WorkspaceSharingSettingsCard() {
  const sharing = useWorkspaceSharingSettings();
  const {
    activeWorkspace,
    activeWorkspaceId,
    canEdit,
    createOpen,
    domainInvites,
    error,
    handleAcceptDomainInvite,
    handleAcceptInvite,
    handleConfirmWorkspaceRemoval,
    handleCreateDomainInvite,
    handleCreateWorkspace,
    handleRemoveMember,
    handleRenameWorkspace,
    handleRevokeDomainInvite,
    handleRevokeInvite,
    handleSwitchWorkspace,
    handleUpdateMemberRole,
    inviteMember,
    inviteOpen,
    invites,
    isOwner,
    members,
    memberships,
    mode,
    newDomain,
    newWorkspaceName,
    pendingDomainInvites,
    pendingInvites,
    removalIntent,
    setCreateOpen,
    setInviteOpen,
    setNewDomain,
    setNewWorkspaceName,
    setRemovalIntent,
    setWorkspaceNameDraft,
    submittingDomain,
    userId,
    workspaceName,
    workspaces,
  } = sharing;

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
        onAcceptDomainInvite={handleAcceptDomainInvite}
        onAcceptInvite={handleAcceptInvite}
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
        onSwitchWorkspace={handleSwitchWorkspace}
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
          onRevokeDomainInvite={handleRevokeDomainInvite}
        />
      )}

      <WorkspaceMembersSection
        isOwner={isOwner}
        members={members}
        userId={userId}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRole={handleUpdateMemberRole}
      />

      <PendingInvitesSection
        invites={invites}
        isOwner={isOwner}
        onRevokeInvite={handleRevokeInvite}
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
