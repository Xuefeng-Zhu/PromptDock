import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { OnboardingScreen, isOnboardingComplete } from './OnboardingScreen';
import { LibraryScreen } from './LibraryScreen';
import { PromptEditor } from './PromptEditor';
import { SettingsScreen } from './SettingsScreen';
import { PromptInspector } from './PromptInspector';
import { CommandPalette } from './CommandPalette';
import { VariableFillModal } from './VariableFillModal';
import { ConflictCenter, ConflictBadge } from '../screens/ConflictCenter';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { useAppModeStore } from '../stores/app-mode-store';
import { ToastContainer } from './ToastContainer';
import { useToastStore } from '../stores/toast-store';
import { hideMainWindow } from '../utils/window';
import { usePromptExecution } from '../hooks/use-prompt-execution';
import { useLibraryData } from '../hooks/use-library-data';
import { extractVariables } from '../utils/prompt-template';
import { readFolders, createFolder } from '../utils/folder-storage';
import { getConflictService } from '../App';
import { trackPromptAction, trackScreenView } from '../services/analytics-service';
import {
  createDefaultPromptFilters,
  type FilterType,
} from '../utils/prompt-filters';
import type { ConflictService } from '../services/conflict-service';
import type { AuthUser, Folder, PromptRecipe } from '../types/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Screen =
  | { name: 'onboarding' }
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings' }
  | { name: 'conflicts' };

export type { FilterType } from '../utils/prompt-filters';
export { filterPrompts } from '../utils/library-filtering';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children?: React.ReactNode;
  authService?: import('../services/interfaces').IAuthService;
  syncService?: {
    transitionToSynced: (
      userId: string,
      workspaceId: string,
      localPrompts: never[],
      migrationChoice: 'fresh',
    ) => Promise<void>;
  };
  conflictService?: ConflictService;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Root layout orchestrator. Reads prompt data from PromptStore and manages
 * navigation via local useState. Renders TopBar, Sidebar, MainContentArea
 * (switching between screens), InspectorPanel (conditional on Library screen
 * with selected prompt), and modal overlays (CommandPalette, VariableFillModal).
 */
export function AppShell({ authService, syncService, conflictService: conflictServiceProp }: AppShellProps) {
  // ── ConflictService resolution ─────────────────────────────────────────────
  // Use the prop if provided (e.g., in tests), otherwise fall back to the global singleton.
  const conflictService = conflictServiceProp ?? getConflictService();

  // ── Subscribe to ConflictService for unresolved conflict count ─────────────
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

  // ── PromptStore selectors ──────────────────────────────────────────────────

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

  // ── SettingsStore selectors ────────────────────────────────────────────────

  const theme = useSettingsStore((s) => s.settings.theme);
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);
  const syncStatus = useAppModeStore((s) => s.syncStatus);

  // ── Toast store ────────────────────────────────────────────────────────────
  const addToast = useToastStore((s) => s.addToast);

  const { copyText, pasteText, executePrompt } = usePromptExecution({
    defaultAction,
    markPromptUsed,
    beforePaste: hideMainWindow,
  });

  // ── Local navigation state (useState) ──────────────────────────────────────

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

  const {
    categoryColorMap,
    derivedFolders,
    filteredPrompts,
    promptCountByFolder,
    selectedPrompt,
    selectedPromptFolder,
    selectedPromptVariables,
    sidebarFilterCounts,
    sidebarTagCounts,
    variableFillPrompt,
    variableFillVariables,
  } = useLibraryData({
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

  // ── Global ⌘K / Ctrl+K keyboard shortcut ──────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (screen.name !== 'library' || selectedPromptId === null) return;
    if (!filteredPrompts.some((prompt) => prompt.id === selectedPromptId)) {
      setSelectedPromptId(null);
    }
  }, [screen.name, selectedPromptId, filteredPrompts]);

  // ── Computed: editor prompt (for editor screen) ────────────────────────────

  const editorPrompt = useMemo(() => {
    if (screen.name !== 'editor') return undefined;
    const promptId = screen.promptId;
    if (!promptId) return undefined;
    return prompts.find((p) => p.id === promptId);
  }, [screen, prompts]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleCommandPaletteOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const blockIfEditorHasUnsavedChanges = useCallback(() => {
    if (screen.name !== 'editor' || !editorHasUnsavedChanges) return false;

    addToast('Save or cancel your prompt changes before leaving the editor.', 'info');
    return true;
  }, [addToast, editorHasUnsavedChanges, screen.name]);

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
  }, [theme, updateSettings, addToast]);

  // ── Navigation callbacks ───────────────────────────────────────────────────

  const handleOnboardingComplete = useCallback((_choice: 'local' | 'sync' | 'signin') => {
    // Navigation to library is handled here; mode transitions and flag persistence
    // are handled by OnboardingScreen itself (Tasks 6.1–6.4).
    setScreen({ name: 'library' });
  }, []);

  const handleSelectPrompt = useCallback((id: string) => {
    setSelectedPromptId(id);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id).catch((err: unknown) => {
      addToast(`Failed to toggle favorite: ${err instanceof Error ? err.message : String(err)}`, 'error');
    });
  }, [toggleFavorite, addToast]);

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
  }, [screen, updatePrompt, createPrompt, addToast, activeWorkspaceId, mode, userId]);

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

  // ── Conflict resolution callbacks ──────────────────────────────────────────

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
    [updatePrompt, addToast],
  );

  // ── Archive and Duplicate callbacks ────────────────────────────────────────

  const handleArchivePrompt = useCallback((id: string) => {
    archivePrompt(id)
      .then(() => trackPromptAction('archived'))
      .catch((err: unknown) => {
        addToast(`Failed to archive prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    if (selectedPromptId === id) {
      setSelectedPromptId(null);
    }
  }, [archivePrompt, selectedPromptId, addToast]);

  const handleDuplicatePrompt = useCallback((id: string) => {
    duplicatePrompt(id)
      .then(() => trackPromptAction('duplicated'))
      .catch((err: unknown) => {
        addToast(`Failed to duplicate prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
  }, [duplicatePrompt, addToast]);

  const handleDeletePrompt = useCallback((id: string) => {
    deletePrompt(id)
      .then(() => trackPromptAction('deleted'))
      .catch((err: unknown) => {
        addToast(`Failed to delete prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    if (selectedPromptId === id) {
      setSelectedPromptId(null);
    }
  }, [deletePrompt, selectedPromptId, addToast]);

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

  // ── Command Palette callbacks ──────────────────────────────────────────────

  const handleCommandPaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleCommandPaletteSelect = useCallback((prompt: PromptRecipe) => {
    const variables = extractVariables(prompt.body);
    setCommandPaletteOpen(false);

    if (variables.length > 0) {
      // Prompt has variables → open VariableFillModal
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

  // ── Variable Fill Modal callbacks ──────────────────────────────────────────

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

  // ── Determine if Inspector should show ─────────────────────────────────────

  const showInspector =
    screen.name === 'library' && selectedPrompt !== null;

  // ── Render ─────────────────────────────────────────────────────────────────

  // Onboarding takes the full screen — no TopBar, Sidebar, or Inspector
  if (screen.name === 'onboarding') {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          authService={authService}
          syncService={syncService}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Fixed top bar */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCommandPaletteOpen={handleCommandPaletteOpen}
        authService={authService}
        mode={mode}
        userId={userId}
        onAuthSuccess={handleAuthSuccess}
        onSignOutSuccess={handleSignOutSuccess}
        syncStatus={syncStatus}
      />

      {/* Conflict badge — shown in header area when unresolved conflicts exist */}
      {unresolvedConflictCount > 0 && (
        <div className="fixed top-0 right-32 z-50 flex h-14 items-center">
          <ConflictBadge
            count={unresolvedConflictCount}
            onClick={handleConflictBadgeClick}
          />
        </div>
      )}

      {/* Body: Sidebar + Main Content + Inspector */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          folders={derivedFolders}
          activeItem={activeSidebarItem}
          onItemSelect={handleSidebarItemSelect}
          promptCountByFolder={promptCountByFolder}
          totalPromptCount={sidebarFilterCounts.total}
          favoriteCount={sidebarFilterCounts.favorites}
          recentCount={sidebarFilterCounts.recent}
          archivedCount={sidebarFilterCounts.archived}
          tagCounts={sidebarTagCounts}
          onSettingsOpen={handleSettingsOpen}
          onToggleTheme={handleToggleTheme}
          onCreateFolder={handleCreateFolder}
          theme={theme}
        />

        {/* Main Content Area */}
        <main
          className={[
            'flex min-h-0 flex-1 flex-col pt-14',
            screen.name === 'settings' ? 'overflow-hidden' : 'overflow-y-auto',
          ].join(' ')}
          style={{ color: 'var(--color-text-main)' }}
        >
          {screen.name === 'library' && (
            <LibraryScreen
              prompts={filteredPrompts}
              filterSourcePrompts={prompts}
              folders={derivedFolders}
              selectedPromptId={selectedPromptId}
              activeFilter={activeFilter}
              onSelectPrompt={handleSelectPrompt}
              onToggleFavorite={handleToggleFavorite}
              onFilterChange={handleFilterChange}
              onNewPrompt={handleNewPrompt}
              categoryColorMap={categoryColorMap}
            />
          )}

          {screen.name === 'editor' && (
            <PromptEditor
              promptId={screen.promptId}
              prompt={editorPrompt}
              folders={derivedFolders}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              onDirtyChange={setEditorHasUnsavedChanges}
              onDuplicate={screen.promptId ? () => {
                handleDuplicatePrompt(screen.promptId!);
                setScreen({ name: 'library' });
              } : undefined}
              onArchive={screen.promptId ? () => {
                handleArchivePrompt(screen.promptId!);
                setScreen({ name: 'library' });
              } : undefined}
              onCopy={screen.promptId && editorPrompt ? () => {
                handleCopyPromptBody(editorPrompt!.body, editorPrompt!.id);
              } : undefined}
            />
          )}

          {screen.name === 'settings' && (
            <SettingsScreen onBack={handleSettingsBack} authService={authService} />
          )}

          {screen.name === 'conflicts' && conflictService && (
            <ConflictCenter
              conflictService={conflictService}
              onResolve={handleConflictResolve}
              onBack={handleConflictBack}
            />
          )}
        </main>

        {/* Inspector Panel — shown when a prompt is selected on Library screen */}
        {showInspector && selectedPrompt && (
          <div className="w-80 shrink-0 overflow-y-auto pt-14">
            <PromptInspector
              prompt={selectedPrompt}
              folder={selectedPromptFolder}
              variables={selectedPromptVariables}
              onToggleFavorite={handleToggleFavorite}
              onEdit={handleEditPrompt}
              onDuplicate={handleDuplicatePrompt}
              onArchive={handleArchivePrompt}
              onDelete={handleDeletePrompt}
              onCopyBody={handleCopyPromptBody}
            />
          </div>
        )}
      </div>

      {/* CommandPalette modal overlay */}
      <CommandPalette
        prompts={prompts}
        isOpen={commandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSelectPrompt={handleCommandPaletteSelect}
      />

      {/* VariableFillModal overlay */}
      {variableFillPrompt && variableFillVariables.length > 0 && (
        <VariableFillModal
          prompt={variableFillPrompt}
          variables={variableFillVariables}
          onCancel={handleVariableFillCancel}
          defaultAction={defaultAction}
          onCopy={handleVariableFillCopy}
          onPaste={handleVariableFillPaste}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
