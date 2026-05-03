import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { getConflictService } from '../App';
import { isOnboardingComplete } from '../utils/onboarding';
import type { AppShellProps, Screen } from '../components/app-shell/types';
import { useLibraryData } from './use-library-data';
import { usePromptExecution } from './use-prompt-execution';
import { useAppModeStore } from '../stores/app-mode-store';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { useToastStore } from '../stores/toast-store';
import { trackPromptAction, trackScreenView } from '../services/analytics-service';
import { createFolder, readFolders } from '../utils/folder-storage';
import { hideMainWindow } from '../utils/window';
import { extractVariables } from '../utils/prompt-template';
import {
  createDefaultPromptFilters,
  type FilterType,
} from '../utils/prompt-filters';
import type { AuthUser, Folder, PromptRecipe } from '../types/index';

export function useAppShellController({
  authService,
  syncService,
  conflictService: conflictServiceProp,
}: AppShellProps) {
  const conflictService = conflictServiceProp ?? getConflictService();
  const unresolvedConflictCount = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        if (!conflictService) return () => {};
        return conflictService.subscribe(cb);
      },
      [conflictService],
    ),
    () => conflictService?.getUnresolvedCount() ?? 0,
  );

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

  const { copyText, pasteText, executePrompt } = usePromptExecution({
    defaultAction,
    markPromptUsed,
    beforePaste: hideMainWindow,
  });

  const [screen, setScreen] = useState<Screen>(() => ({
    name: isOnboardingComplete() ? 'library' : 'onboarding',
  }));
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [variableFillPromptId, setVariableFillPromptId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => createDefaultPromptFilters());
  const [activeSidebarItem, setActiveSidebarItem] = useState('library');
  const [userFolders, setUserFolders] = useState<Folder[]>(() => readFolders());
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState(false);

  const libraryData = useLibraryData({
    activeFilter,
    activeSidebarItem,
    prompts,
    searchQuery,
    selectedPromptId,
    userFolders,
    variableFillPromptId,
  });

  useEffect(() => {
    trackScreenView(screen.name);
  }, [screen.name]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (screen.name !== 'library' || selectedPromptId === null) return;
    if (!libraryData.filteredPrompts.some((prompt) => prompt.id === selectedPromptId)) {
      setSelectedPromptId(null);
    }
  }, [libraryData.filteredPrompts, screen.name, selectedPromptId]);

  const editorPrompt = useMemo(() => {
    if (screen.name !== 'editor') return undefined;
    const promptId = screen.promptId;
    if (!promptId) return undefined;
    return prompts.find((prompt) => prompt.id === promptId);
  }, [prompts, screen]);

  const blockIfEditorHasUnsavedChanges = useCallback(() => {
    if (screen.name !== 'editor' || !editorHasUnsavedChanges) return false;

    addToast('Save or cancel your prompt changes before leaving the editor.', 'info');
    return true;
  }, [addToast, editorHasUnsavedChanges, screen.name]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleCommandPaletteOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleSidebarItemSelect = useCallback((item: string) => {
    if (blockIfEditorHasUnsavedChanges()) return;

    setActiveSidebarItem(item);
    setScreen({ name: 'library' });
    if (item === 'library' || item === 'favorites' || item === 'recent' || item === 'archived') {
      setActiveFilter(createDefaultPromptFilters());
    }
  }, [blockIfEditorHasUnsavedChanges]);

  const handleCreateFolder = useCallback((name: string) => {
    const folder = createFolder(name);
    setUserFolders((prev) => [...prev, folder]);
  }, []);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme }).catch((err: unknown) => {
      addToast(`Failed to update theme: ${err instanceof Error ? err.message : String(err)}`, 'error');
    });
  }, [addToast, theme, updateSettings]);

  const handleOnboardingComplete = useCallback((_choice: 'local' | 'sync' | 'signin') => {
    setScreen({ name: 'library' });
  }, []);

  const handleSelectPrompt = useCallback((id: string) => {
    setSelectedPromptId(id);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id).catch((err: unknown) => {
      addToast(`Failed to toggle favorite: ${err instanceof Error ? err.message : String(err)}`, 'error');
    });
  }, [addToast, toggleFavorite]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const handleNewPrompt = useCallback(() => {
    setScreen({ name: 'editor' });
  }, []);

  const handleEditorSave = useCallback(async (data: Partial<PromptRecipe>) => {
    try {
      if (screen.name === 'editor' && screen.promptId) {
        await updatePrompt(screen.promptId, data);
        trackPromptAction('updated');
      } else {
        const workspaceId = mode !== 'local' && userId ? activeWorkspaceId : 'local';
        const createdBy = mode !== 'local' && userId ? userId : 'local';
        await createPrompt({
          workspaceId,
          title: (data.title as string) ?? 'Untitled',
          description: (data.description as string) ?? '',
          body: (data.body as string) ?? '',
          tags: (data.tags as string[]) ?? [],
          folderId: (data.folderId as string | null) ?? null,
          favorite: (data.favorite as boolean) ?? false,
          archived: false,
          archivedAt: null,
          lastUsedAt: null,
          createdBy,
          version: 1,
        });
        trackPromptAction('created');
      }
      setEditorHasUnsavedChanges(false);
      setScreen({ name: 'library' });
    } catch (err) {
      addToast(`Failed to save prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  }, [activeWorkspaceId, addToast, createPrompt, mode, screen, updatePrompt, userId]);

  const handleEditorCancel = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  const handleSettingsBack = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  const handleSettingsOpen = useCallback(() => {
    if (blockIfEditorHasUnsavedChanges()) return;
    setScreen({ name: 'settings' });
  }, [blockIfEditorHasUnsavedChanges]);

  const handleConflictBadgeClick = useCallback(() => {
    if (blockIfEditorHasUnsavedChanges()) return;
    setScreen({ name: 'conflicts' });
  }, [blockIfEditorHasUnsavedChanges]);

  const handleConflictBack = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  const handleConflictResolve = useCallback(
    (promptId: string, resolvedVersion: PromptRecipe) => {
      updatePrompt(promptId, resolvedVersion).catch((err: unknown) => {
        addToast(`Failed to resolve conflict: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    },
    [addToast, updatePrompt],
  );

  const handleArchivePrompt = useCallback((id: string) => {
    archivePrompt(id)
      .then(() => trackPromptAction('archived'))
      .catch((err: unknown) => {
        addToast(`Failed to archive prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    if (selectedPromptId === id) {
      setSelectedPromptId(null);
    }
  }, [addToast, archivePrompt, selectedPromptId]);

  const handleDuplicatePrompt = useCallback((id: string) => {
    duplicatePrompt(id)
      .then(() => trackPromptAction('duplicated'))
      .catch((err: unknown) => {
        addToast(`Failed to duplicate prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
  }, [addToast, duplicatePrompt]);

  const handleDeletePrompt = useCallback((id: string) => {
    deletePrompt(id)
      .then(() => trackPromptAction('deleted'))
      .catch((err: unknown) => {
        addToast(`Failed to delete prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    if (selectedPromptId === id) {
      setSelectedPromptId(null);
    }
  }, [addToast, deletePrompt, selectedPromptId]);

  const handleEditPrompt = useCallback((id: string) => {
    setScreen({ name: 'editor', promptId: id });
  }, []);

  const handleCopyPromptBody = useCallback((body: string, promptId?: string) => {
    copyText({ text: body, promptId, source: 'prompt_body' })
      .then(() => {
        addToast('Prompt body copied to clipboard', 'success');
      })
      .catch((err: unknown) => {
        addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
  }, [addToast, copyText]);

  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setUserId(user.uid);
    setMode('synced');
  }, [setMode, setUserId]);

  const handleSignOutSuccess = useCallback(() => {
    setUserId(null);
    setMode('local');
  }, [setMode, setUserId]);

  const handleCommandPaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleCommandPaletteSelect = useCallback((prompt: PromptRecipe) => {
    const variables = extractVariables(prompt.body);
    setCommandPaletteOpen(false);

    if (variables.length > 0) {
      setVariableFillPromptId(prompt.id);
      return;
    }

    executePrompt(prompt, { source: 'command_palette' })
      .then((result) => {
        addToast(result.message, 'success');
      })
      .catch((err: unknown) => {
        const action = defaultAction === 'paste' ? 'paste' : 'copy';
        addToast(`Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
  }, [addToast, defaultAction, executePrompt]);

  const handleVariableFillCancel = useCallback(() => {
    setVariableFillPromptId(null);
  }, []);

  const handleVariableFillCopy = useCallback(async (renderedText: string) => {
    try {
      const result = await copyText({
        text: renderedText,
        promptId: variableFillPromptId ?? undefined,
        source: 'variable_fill',
      });
      addToast(result.message, 'success');
    } catch (err) {
      addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  }, [addToast, copyText, variableFillPromptId]);

  const handleVariableFillPaste = useCallback(async (renderedText: string) => {
    try {
      const result = await pasteText({
        text: renderedText,
        promptId: variableFillPromptId ?? undefined,
        source: 'variable_fill',
      });
      addToast(result.message, 'success');
    } catch (err) {
      addToast(`Failed to paste: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  }, [addToast, pasteText, variableFillPromptId]);

  const editorPromptId = screen.name === 'editor' ? screen.promptId : undefined;

  const handleEditorDuplicate = useCallback(() => {
    if (!editorPromptId) return;
    handleDuplicatePrompt(editorPromptId);
    setScreen({ name: 'library' });
  }, [editorPromptId, handleDuplicatePrompt]);

  const handleEditorArchive = useCallback(() => {
    if (!editorPromptId) return;
    handleArchivePrompt(editorPromptId);
    setScreen({ name: 'library' });
  }, [editorPromptId, handleArchivePrompt]);

  const handleEditorCopy = useCallback(() => {
    if (!editorPromptId || !editorPrompt) return;
    handleCopyPromptBody(editorPrompt.body, editorPrompt.id);
  }, [editorPrompt, editorPromptId, handleCopyPromptBody]);

  const showInspector = screen.name === 'library' && libraryData.selectedPrompt !== null;

  return {
    activeFilter,
    activeSidebarItem,
    authService,
    commandPaletteOpen,
    conflictService,
    defaultAction,
    editorPrompt,
    editorPromptId,
    handleAuthSuccess,
    handleArchivePrompt,
    handleCommandPaletteClose,
    handleCommandPaletteOpen,
    handleCommandPaletteSelect,
    handleConflictBack,
    handleConflictBadgeClick,
    handleConflictResolve,
    handleCopyPromptBody,
    handleCreateFolder,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleEditPrompt,
    handleEditorArchive,
    handleEditorCancel,
    handleEditorCopy,
    handleEditorDuplicate,
    handleEditorSave,
    handleFilterChange,
    handleNewPrompt,
    handleOnboardingComplete,
    handleSearchChange,
    handleSelectPrompt,
    handleSettingsBack,
    handleSettingsOpen,
    handleSidebarItemSelect,
    handleSignOutSuccess,
    handleToggleFavorite,
    handleToggleTheme,
    handleVariableFillCancel,
    handleVariableFillCopy,
    handleVariableFillPaste,
    libraryData,
    mode,
    prompts,
    screen,
    searchQuery,
    selectedPromptId,
    setEditorHasUnsavedChanges,
    showInspector,
    syncService,
    syncStatus,
    theme,
    unresolvedConflictCount,
    userId,
  };
}
