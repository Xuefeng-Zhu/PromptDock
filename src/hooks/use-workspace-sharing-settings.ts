import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAppModeStore } from '../stores/app-mode-store';
import { canEditWorkspace, useWorkspaceStore } from '../stores/workspace-store';
import type { Workspace, WorkspaceRemovalIntent, WorkspaceRole } from '../types/index';
import { formatErrorMessage } from '../utils/error-message';

/**
 * Coordinates workspace-sharing settings state, store selectors, and async actions.
 * The settings card stays responsible for layout while this hook owns dialog state,
 * draft fields, and user-facing error mapping for workspace mutations.
 */
export function useWorkspaceSharingSettings() {
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

  useEffect(() => {
    setWorkspaceNameDraft(activeWorkspace?.name ?? '');
  }, [activeWorkspace?.id, activeWorkspace?.name]);

  const runWorkspaceAction = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(formatErrorMessage(err));
    }
  }, []);

  const handleAcceptDomainInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(() => acceptDomainInvite(inviteId));
    },
    [acceptDomainInvite, runWorkspaceAction],
  );

  const handleAcceptInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(() => acceptInvite(inviteId));
    },
    [acceptInvite, runWorkspaceAction],
  );

  const handleCreateWorkspace = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      try {
        await createWorkspace(newWorkspaceName);
        setNewWorkspaceName('');
        setCreateOpen(false);
      } catch (err) {
        setError(formatErrorMessage(err));
      }
    },
    [createWorkspace, newWorkspaceName],
  );

  const handleConfirmWorkspaceRemoval = useCallback(async () => {
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
      setError(formatErrorMessage(err));
    }
  }, [deleteWorkspace, leaveWorkspace, removalIntent]);

  const handleCreateDomainInvite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!newDomain.trim()) return;

      setError(null);
      setSubmittingDomain(true);
      try {
        await createDomainInvite(newDomain);
        setNewDomain('');
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setSubmittingDomain(false);
      }
    },
    [createDomainInvite, newDomain],
  );

  const handleRenameWorkspace = useCallback(async () => {
    if (!workspaceNameDraft.trim() || workspaceNameDraft === activeWorkspace?.name) return;
    setError(null);
    try {
      await renameWorkspace(workspaceNameDraft);
      setWorkspaceNameDraft('');
    } catch (err) {
      setError(formatErrorMessage(err));
    }
  }, [activeWorkspace?.name, renameWorkspace, workspaceNameDraft]);

  const handleSwitchWorkspace = useCallback(
    async (workspaceId: Workspace['id']) => {
      if (workspaceId === activeWorkspaceId) return;
      setError(null);
      try {
        await switchWorkspace(workspaceId);
      } catch (err) {
        setError(formatErrorMessage(err));
      }
    },
    [activeWorkspaceId, switchWorkspace],
  );

  const handleRemoveMember = useCallback(
    (memberUserId: string) => {
      void runWorkspaceAction(() => removeMember(memberUserId));
    },
    [removeMember, runWorkspaceAction],
  );

  const handleRevokeDomainInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(() => revokeDomainInvite(inviteId));
    },
    [revokeDomainInvite, runWorkspaceAction],
  );

  const handleRevokeInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(() => revokeInvite(inviteId));
    },
    [revokeInvite, runWorkspaceAction],
  );

  const handleUpdateMemberRole = useCallback(
    (memberUserId: string, role: WorkspaceRole) => {
      void runWorkspaceAction(() => updateMemberRole(memberUserId, role));
    },
    [runWorkspaceAction, updateMemberRole],
  );

  return {
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
    workspaceName: workspaceNameDraft,
    workspaces,
  };
}
