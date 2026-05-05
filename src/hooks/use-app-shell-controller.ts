import { useCallback, useMemo } from 'react';
import { getConflictService } from '../App';
import type { AppShellProps } from '../components/app-shell/types';
import { useAppModeStore } from '../stores/app-mode-store';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { useToastStore } from '../stores/toast-store';
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
  const duplicatePrompt = usePromptStore((s) => s.duplicatePrompt);
  const deletePrompt = usePromptStore((s) => s.deletePrompt);
  const markPromptUsed = usePromptStore((s) => s.markPromptUsed);
  const activeWorkspaceId = usePromptStore((s) => s.activeWorkspaceId);

  const theme = useSettingsStore((s) => s.settings.theme);
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const addToast = useToastStore((s) => s.addToast);

  const navigation = useShellNavigation({ addToast });
  const {
    activeFilter,
    activeSidebarItem,
    commandPaletteOpen,
    screen,
    selectedPromptId,
    setCommandPaletteOpen,
    setEditorHasUnsavedChanges,
    setScreen,
    setSelectedPromptId,
    setVariableFillPromptId,
    userFolders,
    variableFillPromptId,
  } = navigation;

  const { copyText, pasteText, executePrompt } = usePromptExecution({
    defaultAction,
    markPromptUsed,
    beforePaste: hideMainWindow,
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

  const promptCrud = usePromptCrudActions({
    activeWorkspaceId,
    addToast,
    archivePrompt,
    copyText,
    createPrompt,
    deletePrompt,
    duplicatePrompt,
    mode,
    prompts,
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

  const showInspector = screen.name === 'library' && libraryData.selectedPrompt !== null;

  return {
    activeFilter,
    activeSidebarItem,
    authService,
    commandPaletteOpen,
    conflictService,
    defaultAction,
    editorPrompt,
    editorPromptId: promptCrud.editorPromptId,
    handleAuthSuccess: appModeActions.handleAuthSuccess,
    handleArchivePrompt: promptCrud.handleArchivePrompt,
    handleCommandPaletteClose: promptLaunchFlow.handleCommandPaletteClose,
    handleCommandPaletteOpen: navigation.handleCommandPaletteOpen,
    handleCommandPaletteSelect: promptLaunchFlow.handleCommandPaletteSelect,
    handleConflictBack: navigation.handleConflictBack,
    handleConflictBadgeClick: navigation.handleConflictBadgeClick,
    handleConflictResolve: conflict.handleConflictResolve,
    handleCopyPromptBody: promptCrud.handleCopyPromptBody,
    handleCreateFolder: navigation.handleCreateFolder,
    handleDeletePrompt: promptCrud.handleDeletePrompt,
    handleDuplicatePrompt: promptCrud.handleDuplicatePrompt,
    handleEditPrompt: promptCrud.handleEditPrompt,
    handleEditorArchive: promptCrud.handleEditorArchive,
    handleEditorCancel: navigation.handleEditorCancel,
    handleEditorCopy: promptCrud.handleEditorCopy,
    handleEditorDuplicate: promptCrud.handleEditorDuplicate,
    handleEditorSave: promptCrud.handleEditorSave,
    handleFilterChange: navigation.handleFilterChange,
    handleNewPrompt: navigation.handleNewPrompt,
    handleOnboardingComplete: navigation.handleOnboardingComplete,
    handleSearchChange,
    handleSelectPrompt: navigation.handleSelectPrompt,
    handleSettingsBack: navigation.handleSettingsBack,
    handleSettingsOpen: navigation.handleSettingsOpen,
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
