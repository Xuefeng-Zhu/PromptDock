import { useCallback, useMemo, useState } from 'react';
import { getConflictService } from '../App';
import type {
  AppShellProps,
  DuplicateWorkspaceTarget,
} from '../components/app-shell/types';
import { trackPromptAction } from '../services/analytics-service';
import { useAppModeStore } from '../stores/app-mode-store';
import { useFolderStore } from '../stores/folder-store';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { useToastStore } from '../stores/toast-store';
import { canEditWorkspace as canEditRole, useWorkspaceStore } from '../stores/workspace-store';
import type { Folder } from '../types/index';
import { isTauriRuntime } from '../utils/runtime';
import { hideMainWindow } from '../utils/window';
import { useLibraryData } from './use-library-data';
import { usePromptExecution } from './use-prompt-execution';
import { useAppModeActions } from './app-shell/use-app-mode-actions';
import { useConflictController } from './app-shell/use-conflict-controller';
import { usePromptCrudActions } from './app-shell/use-prompt-crud-actions';
import { usePromptLaunchFlow } from './app-shell/use-prompt-launch-flow';
import {
  useSelectedPromptVisibility,
  useShellNavigation,
} from './app-shell/use-shell-navigation';

function formatPromptCount(count: number): string {
  return `${count} prompt${count === 1 ? '' : 's'}`;
}

interface FolderDeleteConfirmation {
  folder: Folder;
  promptCount: number;
}

/**
 * Composes stores, domain hooks, navigation state, and app-shell handlers into
 * the single controller consumed by AppShellView. This keeps the view mostly
 * declarative while centralizing cross-cutting side effects such as toasts,
 * folder cleanup, prompt execution, sync conflict actions, and auth transitions.
 */
export function useAppShellController({
  authService,
  conflictService: conflictServiceProp,
}: AppShellProps) {
  const conflictService = conflictServiceProp ?? getConflictService();

  const prompts = usePromptStore((s) => s.prompts);
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const setSearchQuery = usePromptStore((s) => s.setSearchQuery);
  const toggleFavorite = usePromptStore((s) => s.toggleFavorite);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);
  const createPrompt = usePromptStore((s) => s.createPrompt);
  const archivePrompt = usePromptStore((s) => s.archivePrompt);
  const restorePrompt = usePromptStore((s) => s.restorePrompt);
  const duplicatePromptToWorkspace = usePromptStore((s) => s.duplicatePromptToWorkspace);
  const deletePrompt = usePromptStore((s) => s.deletePrompt);
  const markPromptUsed = usePromptStore((s) => s.markPromptUsed);
  const clearFolderAssignments = usePromptStore((s) => s.clearFolderAssignments);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const currentWorkspaceRole = useWorkspaceStore((s) => s.currentRole);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const userFolders = useFolderStore((s) => s.folders);
  const createFolder = useFolderStore((s) => s.createFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);

  const theme = useSettingsStore((s) => s.settings.theme);
  const storedDefaultAction = useSettingsStore((s) => s.settings.defaultAction);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const setMode = useAppModeStore((s) => s.setMode);
  const setSyncStatus = useAppModeStore((s) => s.setSyncStatus);
  const setUser = useAppModeStore((s) => s.setUser);
  const setUserId = useAppModeStore((s) => s.setUserId);
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const addToast = useToastStore((s) => s.addToast);
  const [folderDeleteConfirmation, setFolderDeleteConfirmation] = useState<FolderDeleteConfirmation | null>(null);
  const [duplicatePromptId, setDuplicatePromptId] = useState<string | null>(null);
  const canEditWorkspace = mode === 'local' || canEditRole(currentWorkspaceRole);

  const navigation = useShellNavigation({ addToast });
  const {
    activeFilter,
    activeSidebarItem,
    blockIfEditorHasUnsavedChanges,
    commandPaletteOpen,
    screen,
    selectedPromptId,
    setCommandPaletteOpen,
    setEditorHasUnsavedChanges,
    handleFolderDeleted,
    setScreen,
    setSelectedPromptId,
    setVariableFillPromptId,
    variableFillPromptId,
  } = navigation;
  const defaultAction = isTauriRuntime() ? storedDefaultAction : 'copy';

  const { copyText, pasteText, executePrompt } = usePromptExecution({
    defaultAction,
    markPromptUsed,
    beforePaste: hideMainWindow,
    canMarkPromptUsed: canEditWorkspace,
  });

  const libraryData = useLibraryData({
    activeFilter,
    activeSidebarItem,
    prompts,
    searchQuery,
    selectedPromptId,
    userFolders,
    variableFillPromptId,
  });

  useSelectedPromptVisibility({
    filteredPrompts: libraryData.filteredPrompts,
    screen,
    selectedPromptId,
    setSelectedPromptId,
  });

  const editorPrompt = useMemo(() => {
    if (screen.name !== 'editor') return undefined;
    const promptId = screen.promptId;
    if (!promptId) return undefined;
    return prompts.find((prompt) => prompt.id === promptId);
  }, [prompts, screen]);

  const duplicateWorkspaceTargets = useMemo<DuplicateWorkspaceTarget[]>(() => (
    workspaces.flatMap((workspace) => {
      const role = workspace.id === activeWorkspaceId
        ? currentWorkspaceRole
        : memberships.find((membership) => membership.workspaceId === workspace.id)?.role ?? null;

      if (role !== 'owner' && role !== 'editor') return [];

      return [{ role, workspace }];
    })
  ), [activeWorkspaceId, currentWorkspaceRole, memberships, workspaces]);

  const duplicateDialogPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === duplicatePromptId) ?? null,
    [duplicatePromptId, prompts],
  );

  const handleDuplicatePromptRequest = useCallback(
    (id: string) => {
      if (duplicateWorkspaceTargets.length === 0) {
        addToast('You need editor access to a workspace before duplicating this prompt.', 'info');
        return;
      }
      setDuplicatePromptId(id);
    },
    [addToast, duplicateWorkspaceTargets.length],
  );

  const handleDuplicatePromptCancel = useCallback(() => {
    setDuplicatePromptId(null);
  }, []);

  const handleDuplicatePromptConfirm = useCallback(
    async (targetWorkspaceId: string) => {
      if (!duplicateDialogPrompt) {
        throw new Error('Prompt no longer exists.');
      }

      const createdBy = mode !== 'local' && userId ? userId : 'local';
      await duplicatePromptToWorkspace(duplicateDialogPrompt.id, targetWorkspaceId, createdBy);
      trackPromptAction('duplicated');
      setDuplicatePromptId(null);

      const targetName = duplicateWorkspaceTargets.find(
        (target) => target.workspace.id === targetWorkspaceId,
      )?.workspace.name ?? 'workspace';
      addToast(`Duplicated "${duplicateDialogPrompt.title}" to ${targetName}.`, 'success');
    },
    [
      addToast,
      duplicateDialogPrompt,
      duplicatePromptToWorkspace,
      duplicateWorkspaceTargets,
      mode,
      userId,
    ],
  );

  const promptCrud = usePromptCrudActions({
    activeWorkspaceId,
    addToast,
    archivePrompt,
    canEditWorkspace,
    restorePrompt,
    copyText,
    createPrompt,
    deletePrompt,
    mode,
    prompts,
    requestDuplicatePrompt: handleDuplicatePromptRequest,
    screen,
    selectedPromptId,
    setEditorHasUnsavedChanges,
    setScreen,
    setSelectedPromptId,
    toggleFavorite,
    updatePrompt,
    userId,
  });

  const promptLaunchFlow = usePromptLaunchFlow({
    addToast,
    copyText,
    defaultAction,
    executePrompt,
    pasteText,
    setCommandPaletteOpen,
    setVariableFillPromptId,
    variableFillPromptId,
  });

  const conflict = useConflictController({
    addToast,
    conflictService,
    updatePrompt,
  });

  const appModeActions = useAppModeActions({
    setMode,
    setSyncStatus,
    setUser,
    setUserId,
  });

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery],
  );

  const handleToggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme }).catch((err: unknown) => {
      addToast(`Failed to update theme: ${err instanceof Error ? err.message : String(err)}`, 'error');
    });
  }, [addToast, theme, updateSettings]);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!canEditWorkspace) {
        addToast('Viewers cannot create folders in this workspace.', 'info');
        return undefined;
      }
      try {
        return await createFolder(name);
      } catch (err) {
        addToast(`Failed to create folder: ${err instanceof Error ? err.message : String(err)}`, 'error');
        return undefined;
      }
    },
    [addToast, canEditWorkspace, createFolder],
  );

  const handleDeleteFolder = useCallback(
    (folder: Folder) => {
      if (!canEditWorkspace) {
        addToast('Viewers cannot delete folders in this workspace.', 'info');
        return;
      }
      if (blockIfEditorHasUnsavedChanges()) return;

      setFolderDeleteConfirmation({
        folder,
        promptCount: prompts.filter((prompt) => prompt.folderId === folder.id).length,
      });
    },
    [addToast, blockIfEditorHasUnsavedChanges, canEditWorkspace, prompts],
  );

  const handleFolderDeleteCancel = useCallback(() => {
    setFolderDeleteConfirmation(null);
  }, []);

  const handleFolderDeleteConfirm = useCallback(
    async () => {
      const folder = folderDeleteConfirmation?.folder;
      if (!folder) return;

      setFolderDeleteConfirmation(null);

      try {
        const promptsToRestore = prompts.filter((prompt) => prompt.folderId === folder.id);
        // Folder deletion is two-phase: first detach prompts from the folder,
        // then delete the persisted folder record if one exists. Derived legacy
        // folders may only exist because prompts reference their id. If the
        // persisted folder delete fails after prompts were detached, restore the
        // prompt assignments so the failed operation does not partially move data.
        const movedPromptCount = await clearFolderAssignments(folder.id);
        const isPersistedFolder = userFolders.some((item) => item.id === folder.id);
        if (isPersistedFolder) {
          try {
            await deleteFolder(folder.id);
          } catch (err) {
            if (movedPromptCount > 0) {
              await Promise.all(
                promptsToRestore.map((prompt) =>
                  updatePrompt(prompt.id, { folderId: folder.id }),
                ),
              );
            }
            throw err;
          }
        }

        handleFolderDeleted(folder.id);

        const movedSummary = movedPromptCount > 0
          ? ` and moved ${formatPromptCount(movedPromptCount)} to No folder`
          : '';
        addToast(`Deleted folder "${folder.name}"${movedSummary}.`, 'success');
      } catch (err) {
        addToast(`Failed to delete folder: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    },
    [
      addToast,
      clearFolderAssignments,
      deleteFolder,
      folderDeleteConfirmation,
      handleFolderDeleted,
      prompts,
      updatePrompt,
      userFolders,
    ],
  );

  const showInspector = screen.name === 'library' && libraryData.selectedPrompt !== null;

  return {
    activeFilter,
    activeWorkspaceId,
    activeSidebarItem,
    authService,
    commandPaletteOpen,
    conflictService,
    defaultAction,
    duplicateDialogPrompt,
    duplicateWorkspaceTargets,
    editorPrompt,
    editorPromptId: promptCrud.editorPromptId,
    canEditWorkspace,
    handleAuthSuccess: appModeActions.handleAuthSuccess,
    handleArchivePrompt: promptCrud.handleArchivePrompt,
    handleCommandPaletteClose: promptLaunchFlow.handleCommandPaletteClose,
    handleCommandPaletteOpen: navigation.handleCommandPaletteOpen,
    handleCommandPaletteSelect: promptLaunchFlow.handleCommandPaletteSelect,
    handleConflictBack: navigation.handleConflictBack,
    handleConflictBadgeClick: navigation.handleConflictBadgeClick,
    handleConflictResolve: conflict.handleConflictResolve,
    handleCopyPromptBody: promptCrud.handleCopyPromptBody,
    handleCreateFolder,
    handleDeletePrompt: promptCrud.handleDeletePrompt,
    handleDeleteFolder,
    handleDuplicatePromptCancel,
    handleDuplicatePromptConfirm,
    handleDuplicatePrompt: promptCrud.handleDuplicatePrompt,
    handleEditPrompt: promptCrud.handleEditPrompt,
    handleEditorArchive: promptCrud.handleEditorArchive,
    handleEditorCancel: navigation.handleEditorCancel,
    handleEditorCopy: promptCrud.handleEditorCopy,
    handleEditorDuplicate: promptCrud.handleEditorDuplicate,
    handleEditorSave: promptCrud.handleEditorSave,
    handleFilterChange: navigation.handleFilterChange,
    handleFolderDeleteCancel,
    handleFolderDeleteConfirm,
    handleNewPrompt: navigation.handleNewPrompt,
    handleOnboardingComplete: navigation.handleOnboardingComplete,
    handleRestorePrompt: promptCrud.handleRestorePrompt,
    handleSearchChange,
    handleSelectPrompt: navigation.handleSelectPrompt,
    handleSettingsBack: navigation.handleSettingsBack,
    handleSettingsOpen: navigation.handleSettingsOpen,
    handleWorkspaceSettingsOpen: navigation.handleWorkspaceSettingsOpen,
    handleSidebarItemSelect: navigation.handleSidebarItemSelect,
    handleSignOutSuccess: appModeActions.handleSignOutSuccess,
    handleToggleFavorite: promptCrud.handleToggleFavorite,
    handleToggleTheme,
    handleUpdatePromptFolder: promptCrud.handleUpdatePromptFolder,
    handleUpdatePromptTags: promptCrud.handleUpdatePromptTags,
    handleVariableFillCancel: promptLaunchFlow.handleVariableFillCancel,
    handleVariableFillCopy: promptLaunchFlow.handleVariableFillCopy,
    handleVariableFillPaste: promptLaunchFlow.handleVariableFillPaste,
    libraryData,
    mode,
    folderDeleteConfirmation,
    prompts,
    screen,
    searchQuery,
    selectedPromptId,
    setEditorHasUnsavedChanges,
    showInspector,
    syncStatus,
    theme,
    unresolvedConflictCount: conflict.unresolvedConflictCount,
    userId,
  };
}
