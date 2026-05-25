import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAppModeStore } from '../stores/app-mode-store';
import { canEditWorkspace, useWorkspaceStore } from '../stores/workspace-store';
import type { Workspace, WorkspaceRemovalIntent, WorkspaceRole } from '../types/index';
import { formatErrorMessage } from '../utils/error-message';

const CREATE_DOMAIN_INVITE_ACTION = 'create-domain-invite';
const CREATE_WORKSPACE_ACTION = 'create-workspace';
const RENAME_WORKSPACE_ACTION = 'rename-workspace';

function workspaceActionKey(action: string, id: string): string {
  return `${action}:${id}`;
}

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
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingActionKeys, setPendingActionKeys] = useState<Set<string>>(() => new Set());
  const pendingActionKeysRef = useRef(new Set<string>());

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces],
  );
  const isOwner = currentRole === 'owner';
  const canEdit = mode === 'local' || canEditWorkspace(currentRole);

  useEffect(() => {
    setWorkspaceNameDraft(activeWorkspace?.name ?? '');
  }, [activeWorkspace?.id, activeWorkspace?.name]);

  const beginWorkspaceAction = useCallback((key: string) => {
    if (pendingActionKeysRef.current.has(key)) return false;

    const nextKeys = new Set(pendingActionKeysRef.current);
    nextKeys.add(key);
    pendingActionKeysRef.current = nextKeys;
    setPendingActionKeys(nextKeys);
    setError(null);
    return true;
  }, []);

  const finishWorkspaceAction = useCallback((key: string) => {
    if (!pendingActionKeysRef.current.has(key)) return;

    const nextKeys = new Set(pendingActionKeysRef.current);
    nextKeys.delete(key);
    pendingActionKeysRef.current = nextKeys;
    setPendingActionKeys(nextKeys);
  }, []);

  const isWorkspaceActionPending = useCallback(
    (key: string) => pendingActionKeys.has(key),
    [pendingActionKeys],
  );

  const runWorkspaceAction = useCallback(async (key: string, action: () => Promise<void>) => {
    if (!beginWorkspaceAction(key)) return false;

    try {
      await action();
      return true;
    } catch (err) {
      setError(formatErrorMessage(err));
      return false;
    } finally {
      finishWorkspaceAction(key);
    }
  }, [beginWorkspaceAction, finishWorkspaceAction]);

  const handleAcceptDomainInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(
        workspaceActionKey('accept-domain-invite', inviteId),
        () => acceptDomainInvite(inviteId),
      );
    },
    [acceptDomainInvite, runWorkspaceAction],
  );

  const handleAcceptInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(
        workspaceActionKey('accept-invite', inviteId),
        () => acceptInvite(inviteId),
      );
    },
    [acceptInvite, runWorkspaceAction],
  );

  const handleCreateWorkspace = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const created = await runWorkspaceAction(CREATE_WORKSPACE_ACTION, async () => {
        await createWorkspace(newWorkspaceName);
      });
      if (created) {
        setNewWorkspaceName('');
        setCreateOpen(false);
      }
    },
    [createWorkspace, newWorkspaceName, runWorkspaceAction],
  );

  const handleConfirmWorkspaceRemoval = useCallback(async () => {
    if (!removalIntent) return;

    const intent = removalIntent;
    setRemovalIntent(null);

    await runWorkspaceAction(workspaceActionKey(`workspace-${intent.action}`, intent.workspace.id), async () => {
      if (intent.action === 'delete') {
        await deleteWorkspace(intent.workspace.id);
      } else {
        await leaveWorkspace(intent.workspace.id);
      }
    });
  }, [deleteWorkspace, leaveWorkspace, removalIntent, runWorkspaceAction]);

  const handleCreateDomainInvite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!newDomain.trim()) return;

      const created = await runWorkspaceAction(CREATE_DOMAIN_INVITE_ACTION, async () => {
        await createDomainInvite(newDomain);
      });
      if (created) {
        setNewDomain('');
      }
    },
    [createDomainInvite, newDomain, runWorkspaceAction],
  );

  const handleRenameWorkspace = useCallback(async () => {
    if (!workspaceNameDraft.trim() || workspaceNameDraft === activeWorkspace?.name) return;
    const renamed = await runWorkspaceAction(RENAME_WORKSPACE_ACTION, async () => {
      await renameWorkspace(workspaceNameDraft);
    });
    if (renamed) {
      setWorkspaceNameDraft('');
    }
  }, [activeWorkspace?.name, renameWorkspace, runWorkspaceAction, workspaceNameDraft]);

  const handleSwitchWorkspace = useCallback(
    async (workspaceId: Workspace['id']) => {
      if (workspaceId === activeWorkspaceId) return;
      await runWorkspaceAction(workspaceActionKey('switch-workspace', workspaceId), async () => {
        await switchWorkspace(workspaceId);
      });
    },
    [activeWorkspaceId, runWorkspaceAction, switchWorkspace],
  );

  const handleRemoveMember = useCallback(
    (memberUserId: string) => {
      void runWorkspaceAction(
        workspaceActionKey('remove-member', memberUserId),
        () => removeMember(memberUserId),
      );
    },
    [removeMember, runWorkspaceAction],
  );

  const handleRevokeDomainInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(
        workspaceActionKey('revoke-domain-invite', inviteId),
        () => revokeDomainInvite(inviteId),
      );
    },
    [revokeDomainInvite, runWorkspaceAction],
  );

  const handleRevokeInvite = useCallback(
    (inviteId: string) => {
      void runWorkspaceAction(
        workspaceActionKey('revoke-invite', inviteId),
        () => revokeInvite(inviteId),
      );
    },
    [revokeInvite, runWorkspaceAction],
  );

  const handleUpdateMemberRole = useCallback(
    (memberUserId: string, role: WorkspaceRole) => {
      void runWorkspaceAction(
        workspaceActionKey('update-member-role', memberUserId),
        () => updateMemberRole(memberUserId, role),
      );
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
    isAcceptingDomainInvite: (inviteId: string) =>
      isWorkspaceActionPending(workspaceActionKey('accept-domain-invite', inviteId)),
    isAcceptingInvite: (inviteId: string) =>
      isWorkspaceActionPending(workspaceActionKey('accept-invite', inviteId)),
    isCreatingWorkspace: isWorkspaceActionPending(CREATE_WORKSPACE_ACTION),
    isRemovingMember: (memberUserId: string) =>
      isWorkspaceActionPending(workspaceActionKey('remove-member', memberUserId)),
    isRemovingWorkspace: (workspaceId: string) =>
      isWorkspaceActionPending(workspaceActionKey('workspace-delete', workspaceId))
      || isWorkspaceActionPending(workspaceActionKey('workspace-leave', workspaceId)),
    isRenamingWorkspace: isWorkspaceActionPending(RENAME_WORKSPACE_ACTION),
    isRevokingDomainInvite: (inviteId: string) =>
      isWorkspaceActionPending(workspaceActionKey('revoke-domain-invite', inviteId)),
    isRevokingInvite: (inviteId: string) =>
      isWorkspaceActionPending(workspaceActionKey('revoke-invite', inviteId)),
    isSwitchingWorkspace: (workspaceId: string) =>
      isWorkspaceActionPending(workspaceActionKey('switch-workspace', workspaceId)),
    isUpdatingMemberRole: (memberUserId: string) =>
      isWorkspaceActionPending(workspaceActionKey('update-member-role', memberUserId)),
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
    submittingDomain: isWorkspaceActionPending(CREATE_DOMAIN_INVITE_ACTION),
    userId,
    workspaceName: workspaceNameDraft,
    workspaces,
  };
}
