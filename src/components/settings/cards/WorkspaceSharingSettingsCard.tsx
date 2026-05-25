import { UserPlus } from 'lucide-react';
import { useWorkspaceSharingSettings } from '../../../hooks/use-workspace-sharing-settings';
import type { WorkspaceRemovalIntent } from '../../../types/index';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmationDialog } from '../../ui/ConfirmationDialog';
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
    isAcceptingDomainInvite,
    isAcceptingInvite,
    isCreatingWorkspace,
    isRemovingMember,
    isRemovingWorkspace,
    isRenamingWorkspace,
    isRevokingDomainInvite,
    isRevokingInvite,
    isSwitchingWorkspace,
    isUpdatingMemberRole,
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
        isAcceptingDomainInvite={isAcceptingDomainInvite}
        isAcceptingInvite={isAcceptingInvite}
        onAcceptDomainInvite={handleAcceptDomainInvite}
        onAcceptInvite={handleAcceptInvite}
      />

      <WorkspaceListSection
        activeWorkspaceId={activeWorkspaceId}
        createOpen={createOpen}
        memberships={memberships}
        isCreatingWorkspace={isCreatingWorkspace}
        isRemovingWorkspace={isRemovingWorkspace}
        isSwitchingWorkspace={isSwitchingWorkspace}
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
          isRenamingWorkspace={isRenamingWorkspace}
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
          isRevokingDomainInvite={isRevokingDomainInvite}
          newDomain={newDomain}
          submittingDomain={submittingDomain}
          onCreateDomainInvite={handleCreateDomainInvite}
          onNewDomainChange={setNewDomain}
          onRevokeDomainInvite={handleRevokeDomainInvite}
        />
      )}

      <WorkspaceMembersSection
        isOwner={isOwner}
        isRemovingMember={isRemovingMember}
        isUpdatingMemberRole={isUpdatingMemberRole}
        members={members}
        userId={userId}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRole={handleUpdateMemberRole}
      />

      <PendingInvitesSection
        invites={invites}
        isOwner={isOwner}
        isRevokingInvite={isRevokingInvite}
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
    <ConfirmationDialog
      confirmLabel={actionLabel}
      description={description}
      idPrefix="workspace-removal"
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      zIndexClassName="z-[90]"
    />
  );
}
