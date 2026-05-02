import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { OnboardingScreen, isOnboardingComplete } from './OnboardingScreen';
import { LibraryScreen } from './LibraryScreen';
import { PromptEditor, extractVariables } from './PromptEditor';
import { SettingsScreen } from './SettingsScreen';
import { PromptInspector } from './PromptInspector';
import { CommandPalette } from './CommandPalette';
import { VariableFillModal } from './VariableFillModal';
import { ConflictCenter, ConflictBadge } from '../screens/ConflictCenter';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { useAppModeStore } from '../stores/app-mode-store';
import { PROMPT_CATEGORY_MAP, CATEGORY_COLORS } from '../data/mock-data';
import { ToastContainer } from './ToastContainer';
import { useToastStore } from '../stores/toast-store';
import { copyToClipboard, pasteToActiveApp } from '../utils/clipboard';
import { hideMainWindow } from '../utils/window';
import { computeFilterCounts, computeTagCounts } from '../utils/sidebar-counts';
import { readFolders, createFolder } from '../utils/folder-storage';
import { getConflictService } from '../App';
import { SearchEngine } from '../services/search-engine';
import { trackPromptAction, trackScreenView } from '../services/analytics-service';
import type { ConflictService } from '../services/conflict-service';
import type { PromptRecipe } from '../types/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Screen =
  | { name: 'onboarding' }
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings' }
  | { name: 'conflicts' };

export type FilterType = 'all' | 'favorites' | 'recent';

// ─── Filtering Logic ───────────────────────────────────────────────────────────

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_LEVEL_SIDEBAR_ITEMS = new Set([
  'library',
  'favorites',
  'recent',
  'archived',
  'tags',
  'workspaces',
]);
const librarySearchEngine = new SearchEngine();

function isRecentPrompt(prompt: PromptRecipe, referenceDate: Date = new Date()): boolean {
  if (!prompt.lastUsedAt) return false;
  return prompt.lastUsedAt.getTime() > referenceDate.getTime() - RECENT_WINDOW_MS;
}

/**
 * Standalone search and filter function for prompts.
 * Exported separately for testability and property-based testing.
 *
 * Filtering pipeline:
 * 1. Apply sidebar library/folder/tag filter
 * 2. Exclude archived prompts unless the archived sidebar item is selected
 * 3. Apply search query (case-insensitive substring match on title, description, tags)
 * 4. Apply filter chip ("all", "favorites", "recent")
 */
export function filterPrompts(
  prompts: PromptRecipe[],
  searchQuery: string,
  activeFilter: FilterType,
  activeSidebarItem: string,
): PromptRecipe[] {
  const showingArchived = activeSidebarItem === 'archived';
  let result = prompts.filter((p) => p.archived === showingArchived);

  if (activeSidebarItem === 'favorites') {
    result = result.filter((p) => p.favorite === true);
  } else if (activeSidebarItem === 'recent') {
    result = result.filter((p) => isRecentPrompt(p));
  } else if (activeSidebarItem.startsWith('tag-')) {
    const selectedTag = activeSidebarItem.slice(4);
    result = result.filter((p) =>
      p.tags.some((tag) => tag.toLowerCase() === selectedTag),
    );
  } else if (!TOP_LEVEL_SIDEBAR_ITEMS.has(activeSidebarItem)) {
    result = result.filter((p) => p.folderId === activeSidebarItem);
  }

  // Search filtering: case-insensitive substring match against title, description, and tags
  if (searchQuery.trim() !== '') {
    result = librarySearchEngine.search(result, searchQuery, {
      includeArchived: showingArchived,
      fields: ['title', 'tags', 'description'],
    });
  }

  // Filter chip logic
  switch (activeFilter) {
    case 'favorites':
      result = result.filter((p) => p.favorite === true);
      break;
    case 'recent':
      result = result.filter((p) => isRecentPrompt(p)).sort((a, b) => {
        const aTime = a.lastUsedAt ? a.lastUsedAt.getTime() : 0;
        const bTime = b.lastUsedAt ? b.lastUsedAt.getTime() : 0;
        return bTime - aTime;
      });
      break;
    case 'all':
    default:
      break;
  }

  return result;
}

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
  const loadPrompts = usePromptStore((s) => s.loadPrompts);
  const markPromptUsed = usePromptStore((s) => s.markPromptUsed);

  // ── SettingsStore selectors ────────────────────────────────────────────────

  const theme = useSettingsStore((s) => s.settings.theme);
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const syncStatus = useAppModeStore((s) => s.syncStatus);

  // ── Toast store ────────────────────────────────────────────────────────────
  const addToast = useToastStore((s) => s.addToast);

  // ── Local navigation state (useState) ──────────────────────────────────────

  const [screen, setScreen] = useState<Screen>(() => ({
    name: isOnboardingComplete() ? 'library' : 'onboarding',
  }));
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [variableFillPromptId, setVariableFillPromptId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSidebarItem, setActiveSidebarItem] = useState('library');
  const [userFolders, setUserFolders] = useState<import('../types/index').Folder[]>(() => readFolders());
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState(false);

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

  // ── Computed: folders from prompts (derive from prompt data) ───────────────
  // For now, derive unique folders from prompt folderId values.
  // In a future task, folders will come from a dedicated store or repository.

  const derivedFolders = useMemo(() => {
    const folderMap = new Map<string, { id: string; name: string; createdAt: Date; updatedAt: Date }>();
    // Include user-created folders first
    for (const folder of userFolders) {
      folderMap.set(folder.id, folder);
    }
    // Also include folders derived from prompt folderId values
    for (const prompt of prompts) {
      if (prompt.folderId && !folderMap.has(prompt.folderId)) {
        folderMap.set(prompt.folderId, {
          id: prompt.folderId,
          name: prompt.folderId.replace('folder-', '').replace(/^\w/, (c) => c.toUpperCase()),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    return Array.from(folderMap.values()).map((f) => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }, [prompts, userFolders]);

  // ── Computed: filtered prompts ─────────────────────────────────────────────

  const filteredPrompts = useMemo(
    () =>
      filterPrompts(
        prompts,
        searchQuery,
        activeFilter,
        activeSidebarItem,
      ),
    [prompts, searchQuery, activeFilter, activeSidebarItem],
  );

  useEffect(() => {
    if (screen.name !== 'library' || selectedPromptId === null) return;
    if (!filteredPrompts.some((prompt) => prompt.id === selectedPromptId)) {
      setSelectedPromptId(null);
    }
  }, [screen.name, selectedPromptId, filteredPrompts]);

  // ── Computed: prompt count by folder ───────────────────────────────────────

  const promptCountByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prompt of prompts) {
      if (prompt.folderId && !prompt.archived) {
        counts[prompt.folderId] = (counts[prompt.folderId] ?? 0) + 1;
      }
    }
    return counts;
  }, [prompts]);

  // ── Computed: sidebar filter counts ─────────────────────────────────────────

  const sidebarFilterCounts = useMemo(
    () => computeFilterCounts(prompts),
    [prompts],
  );

  // ── Computed: sidebar tag counts ───────────────────────────────────────────

  const sidebarTagCounts = useMemo(
    () => computeTagCounts(prompts),
    [prompts],
  );

  // ── Computed: category color map (prompt ID → Tailwind class string) ───────

  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [promptId, categoryKey] of Object.entries(PROMPT_CATEGORY_MAP)) {
      const colors = CATEGORY_COLORS[categoryKey];
      if (colors) {
        map[promptId] = `${colors.bg} ${colors.text}`;
      }
    }
    return map;
  }, []);

  // ── Computed: selected prompt object ───────────────────────────────────────

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  // ── Computed: selected prompt's folder ─────────────────────────────────────

  const selectedPromptFolder = useMemo(
    () =>
      selectedPrompt?.folderId
        ? derivedFolders.find((f) => f.id === selectedPrompt.folderId)
        : undefined,
    [selectedPrompt, derivedFolders],
  );

  // ── Computed: selected prompt's variables ──────────────────────────────────

  const selectedPromptVariables = useMemo(
    () => (selectedPrompt ? extractVariables(selectedPrompt.body) : []),
    [selectedPrompt],
  );

  // ── Computed: editor prompt (for editor screen) ────────────────────────────

  const editorPrompt = useMemo(() => {
    if (screen.name !== 'editor') return undefined;
    const promptId = screen.promptId;
    if (!promptId) return undefined;
    return prompts.find((p) => p.id === promptId);
  }, [screen, prompts]);

  // ── Computed: variable fill prompt and its variables ───────────────────────

  const variableFillPrompt = useMemo(
    () =>
      variableFillPromptId
        ? prompts.find((p) => p.id === variableFillPromptId) ?? null
        : null,
    [prompts, variableFillPromptId],
  );

  const variableFillVariables = useMemo(
    () => (variableFillPrompt ? extractVariables(variableFillPrompt.body) : []),
    [variableFillPrompt],
  );

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
      setActiveFilter('all');
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
        await createPrompt({
          workspaceId: 'local',
          title: (data.title as string) ?? 'Untitled',
          description: (data.description as string) ?? '',
          body: (data.body as string) ?? '',
          tags: (data.tags as string[]) ?? [],
          folderId: (data.folderId as string | null) ?? null,
          favorite: (data.favorite as boolean) ?? false,
          archived: false,
          archivedAt: null,
          lastUsedAt: null,
          createdBy: 'local',
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
  }, [screen, updatePrompt, createPrompt, addToast]);

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
    copyToClipboard(body)
      .then(() => {
        if (promptId) {
          void markPromptUsed(promptId).catch((err: unknown) => {
            console.error('Failed to update last used timestamp:', err);
          });
        }
        trackPromptAction('copied', { source: 'prompt_body' });
        addToast('Prompt body copied to clipboard', 'success');
      })
      .catch((err: unknown) => {
        addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
  }, [addToast, markPromptUsed]);

  const handleSync = useCallback(() => {
    loadPrompts().catch((err: unknown) => {
      addToast(`Failed to sync prompts: ${err instanceof Error ? err.message : String(err)}`, 'error');
    });
  }, [loadPrompts, addToast]);

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
    } else if (defaultAction === 'paste') {
      pasteToActiveApp(prompt.body, hideMainWindow)
        .then((result) => {
          void markPromptUsed(prompt.id).catch((err: unknown) => {
            console.error('Failed to update last used timestamp:', err);
          });
          trackPromptAction(result?.pasted === false ? 'copied' : 'pasted', {
            source: 'command_palette',
          });
          addToast(result?.pasted === false ? 'Prompt copied to clipboard' : 'Prompt pasted', 'success');
        })
        .catch((err: unknown) => {
          addToast(`Failed to paste: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    } else {
      copyToClipboard(prompt.body)
        .then(() => {
          void markPromptUsed(prompt.id).catch((err: unknown) => {
            console.error('Failed to update last used timestamp:', err);
          });
          trackPromptAction('copied', { source: 'command_palette' });
          addToast('Prompt copied to clipboard', 'success');
        })
        .catch((err: unknown) => {
          addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    }
  }, [addToast, defaultAction, markPromptUsed]);

  // ── Variable Fill Modal callbacks ──────────────────────────────────────────

  const handleVariableFillCancel = useCallback(() => {
    setVariableFillPromptId(null);
  }, []);

  const handleVariableFillCopy = useCallback(async (renderedText: string) => {
    try {
      await copyToClipboard(renderedText);
      if (variableFillPromptId) {
        void markPromptUsed(variableFillPromptId).catch((err: unknown) => {
          console.error('Failed to update last used timestamp:', err);
        });
      }
      trackPromptAction('copied', { source: 'variable_fill' });
      addToast('Prompt copied to clipboard', 'success');
    } catch (err) {
      addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  }, [addToast, markPromptUsed, variableFillPromptId]);

  const handleVariableFillPaste = useCallback(async (renderedText: string) => {
    try {
      const result = await pasteToActiveApp(renderedText, hideMainWindow);
      if (variableFillPromptId) {
        void markPromptUsed(variableFillPromptId).catch((err: unknown) => {
          console.error('Failed to update last used timestamp:', err);
        });
      }
      trackPromptAction(result?.pasted === false ? 'copied' : 'pasted', {
        source: 'variable_fill',
      });
      addToast(result?.pasted === false ? 'Prompt copied to clipboard' : 'Prompt pasted', 'success');
    } catch (err) {
      addToast(`Failed to paste: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  }, [addToast, markPromptUsed, variableFillPromptId]);

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
        onSettingsOpen={handleSettingsOpen}
        onSync={handleSync}
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
