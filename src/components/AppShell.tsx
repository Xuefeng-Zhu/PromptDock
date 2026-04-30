import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { OnboardingScreen } from './OnboardingScreen';
import { LibraryScreen } from './LibraryScreen';
import { PromptEditor, extractVariables } from './PromptEditor';
import { SettingsScreen } from './SettingsScreen';
import { PromptInspector } from './PromptInspector';
import { CommandPalette } from './CommandPalette';
import { VariableFillModal } from './VariableFillModal';
import { MOCK_PROMPTS, MOCK_FOLDERS, PROMPT_CATEGORY_MAP, CATEGORY_COLORS } from '../data/mock-data';
import type { PromptRecipe, Folder } from '../types/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Screen =
  | { name: 'onboarding' }
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings' };

export type FilterType = 'all' | 'favorites' | 'recent';

export interface AppState {
  screen: Screen;
  selectedPromptId: string | null;
  searchQuery: string;
  activeFilter: FilterType;
  activeSidebarItem: string;
  commandPaletteOpen: boolean;
  variableFillPromptId: string | null;
  prompts: PromptRecipe[];
  folders: Folder[];
}

export type AppAction =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'SELECT_PROMPT'; promptId: string | null }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_FILTER'; filter: FilterType }
  | { type: 'TOGGLE_FAVORITE'; promptId: string }
  | { type: 'SET_SIDEBAR_ITEM'; item: string }
  | { type: 'OPEN_COMMAND_PALETTE' }
  | { type: 'CLOSE_COMMAND_PALETTE' }
  | { type: 'OPEN_VARIABLE_FILL'; promptId: string }
  | { type: 'CLOSE_VARIABLE_FILL' }
  | { type: 'SAVE_PROMPT'; promptId: string; data: Partial<PromptRecipe> }
  | { type: 'CREATE_PROMPT'; prompt: PromptRecipe };

// ─── Reducer ───────────────────────────────────────────────────────────────────

/**
 * Pure reducer function for all AppShell state transitions.
 * Exported separately for testability.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen };

    case 'SELECT_PROMPT':
      return { ...state, selectedPromptId: action.promptId };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    case 'SET_FILTER':
      return { ...state, activeFilter: action.filter };

    case 'TOGGLE_FAVORITE': {
      // TODO: replace with repository call for backend persistence
      const updatedPrompts = state.prompts.map((p) =>
        p.id === action.promptId ? { ...p, favorite: !p.favorite } : p,
      );
      return { ...state, prompts: updatedPrompts };
    }

    case 'SET_SIDEBAR_ITEM':
      return { ...state, activeSidebarItem: action.item };

    case 'OPEN_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: true };

    case 'CLOSE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: false };

    case 'OPEN_VARIABLE_FILL':
      return { ...state, variableFillPromptId: action.promptId };

    case 'CLOSE_VARIABLE_FILL':
      return { ...state, variableFillPromptId: null };

    case 'SAVE_PROMPT': {
      // TODO: replace with repository call for backend persistence
      const savedPrompts = state.prompts.map((p) =>
        p.id === action.promptId ? { ...p, ...action.data, updatedAt: new Date() } : p,
      );
      return { ...state, prompts: savedPrompts };
    }

    case 'CREATE_PROMPT':
      // TODO: replace with repository call for backend persistence
      return { ...state, prompts: [...state.prompts, action.prompt] };

    default:
      return state;
  }
}

// ─── Filtering Logic ───────────────────────────────────────────────────────────

/**
 * Standalone search and filter function for prompts.
 * Exported separately for testability and property-based testing.
 *
 * Filtering pipeline:
 * 1. Exclude archived prompts
 * 2. Apply sidebar folder filter (if a folder is selected)
 * 3. Apply search query (case-insensitive substring match on title, description, tags)
 * 4. Apply filter chip ("all", "favorites", "recent")
 */
export function filterPrompts(
  prompts: PromptRecipe[],
  searchQuery: string,
  activeFilter: FilterType,
  activeSidebarItem: string,
): PromptRecipe[] {
  let result = prompts.filter((p) => !p.archived);

  // Sidebar folder filtering
  if (
    activeSidebarItem !== 'library' &&
    activeSidebarItem !== 'tags' &&
    activeSidebarItem !== 'workspaces'
  ) {
    // activeSidebarItem is a folderId
    result = result.filter((p) => p.folderId === activeSidebarItem);
  }

  // Search filtering: case-insensitive substring match against title, description, and tags
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  // Filter chip logic
  switch (activeFilter) {
    case 'favorites':
      result = result.filter((p) => p.favorite === true);
      break;
    case 'recent':
      result = [...result].sort((a, b) => {
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

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: AppState = {
  screen: { name: 'onboarding' },
  selectedPromptId: null,
  searchQuery: '',
  activeFilter: 'all',
  activeSidebarItem: 'library',
  commandPaletteOpen: false,
  variableFillPromptId: null,
  prompts: MOCK_PROMPTS,
  folders: MOCK_FOLDERS,
};

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children?: React.ReactNode;
  /** Override initial state for testing */
  initialStateOverride?: AppState;
  /** Initial prompts to load — defaults to MOCK_PROMPTS if not provided */
  prompts?: PromptRecipe[];
  /** Initial folders to load — defaults to MOCK_FOLDERS if not provided */
  folders?: Folder[];
  // TODO: accept async functions for future backend wiring
  /** Async callback for saving prompts — wired to backend in future */
  onSavePrompt?: (data: Partial<PromptRecipe>) => Promise<void>;
  /** Async callback for deleting prompts — wired to backend in future */
  onDeletePrompt?: (promptId: string) => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Root layout orchestrator. Manages all navigation and shared UI state via
 * useReducer. Renders TopBar, Sidebar, MainContentArea (switching between
 * screens), InspectorPanel (conditional on Library screen with selected
 * prompt), and modal overlays (CommandPalette, VariableFillModal).
 */
export function AppShell({
  initialStateOverride,
  prompts: propPrompts,
  folders: propFolders,
  onSavePrompt: _onSavePrompt,
  onDeletePrompt: _onDeletePrompt,
}: AppShellProps) {
  const resolvedInitialState = initialStateOverride ?? {
    ...initialState,
    prompts: propPrompts ?? MOCK_PROMPTS,
    folders: propFolders ?? MOCK_FOLDERS,
  };
  const [state, dispatch] = useReducer(appReducer, resolvedInitialState);

  // ── Global ⌘K / Ctrl+K keyboard shortcut ──────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: register via Tauri global shortcut plugin for system-wide access
        dispatch({ type: 'OPEN_COMMAND_PALETTE' });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Computed: filtered prompts ─────────────────────────────────────────────

  const filteredPrompts = useMemo(
    () =>
      filterPrompts(
        state.prompts,
        state.searchQuery,
        state.activeFilter,
        state.activeSidebarItem,
      ),
    [state.prompts, state.searchQuery, state.activeFilter, state.activeSidebarItem],
  );

  // ── Computed: prompt count by folder ───────────────────────────────────────

  const promptCountByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prompt of state.prompts) {
      if (prompt.folderId && !prompt.archived) {
        counts[prompt.folderId] = (counts[prompt.folderId] ?? 0) + 1;
      }
    }
    return counts;
  }, [state.prompts]);

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
    () => state.prompts.find((p) => p.id === state.selectedPromptId) ?? null,
    [state.prompts, state.selectedPromptId],
  );

  // ── Computed: selected prompt's folder ─────────────────────────────────────

  const selectedPromptFolder = useMemo(
    () =>
      selectedPrompt?.folderId
        ? state.folders.find((f) => f.id === selectedPrompt.folderId)
        : undefined,
    [selectedPrompt, state.folders],
  );

  // ── Computed: selected prompt's variables ──────────────────────────────────

  const selectedPromptVariables = useMemo(
    () => (selectedPrompt ? extractVariables(selectedPrompt.body) : []),
    [selectedPrompt],
  );

  // ── Computed: editor prompt (for editor screen) ────────────────────────────

  const editorPrompt = useMemo(() => {
    if (state.screen.name !== 'editor') return undefined;
    const promptId = state.screen.promptId;
    if (!promptId) return undefined;
    return state.prompts.find((p) => p.id === promptId);
  }, [state.screen, state.prompts]);

  // ── Computed: variable fill prompt and its variables ───────────────────────

  const variableFillPrompt = useMemo(
    () =>
      state.variableFillPromptId
        ? state.prompts.find((p) => p.id === state.variableFillPromptId) ?? null
        : null,
    [state.prompts, state.variableFillPromptId],
  );

  const variableFillVariables = useMemo(
    () => (variableFillPrompt ? extractVariables(variableFillPrompt.body) : []),
    [variableFillPrompt],
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', query });
  }, []);

  const handleCommandPaletteOpen = useCallback(() => {
    dispatch({ type: 'OPEN_COMMAND_PALETTE' });
  }, []);

  const handleSidebarItemSelect = useCallback((item: string) => {
    dispatch({ type: 'SET_SIDEBAR_ITEM', item });
  }, []);

  // ── Navigation callbacks ───────────────────────────────────────────────────

  const handleOnboardingComplete = useCallback((_choice: 'local' | 'sync' | 'signin') => {
    // TODO: wire to AuthService / AppModeProvider based on choice
    dispatch({ type: 'NAVIGATE', screen: { name: 'library' } });
  }, []);

  const handleSelectPrompt = useCallback((id: string) => {
    dispatch({ type: 'SELECT_PROMPT', promptId: id });
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', promptId: id });
  }, []);

  const handleFilterChange = useCallback((filter: FilterType) => {
    dispatch({ type: 'SET_FILTER', filter });
  }, []);

  const handleNewPrompt = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: { name: 'editor' } });
  }, []);

  const handleEditorSave = useCallback((data: Partial<PromptRecipe>) => {
    // TODO: replace with repository call for backend persistence
    if (state.screen.name === 'editor' && state.screen.promptId) {
      // Editing existing prompt
      dispatch({ type: 'SAVE_PROMPT', promptId: state.screen.promptId, data });
    } else {
      // Creating new prompt
      const newPrompt: PromptRecipe = {
        id: `prompt-${Date.now()}`,
        workspaceId: 'local',
        title: (data.title as string) ?? 'Untitled',
        description: (data.description as string) ?? '',
        body: (data.body as string) ?? '',
        tags: (data.tags as string[]) ?? [],
        folderId: (data.folderId as string | null) ?? null,
        favorite: (data.favorite as boolean) ?? false,
        archived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      };
      dispatch({ type: 'CREATE_PROMPT', prompt: newPrompt });
    }
    dispatch({ type: 'NAVIGATE', screen: { name: 'library' } });
  }, [state.screen]);

  const handleEditorCancel = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: { name: 'library' } });
  }, []);

  const handleSettingsBack = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: { name: 'library' } });
  }, []);

  const handleSettingsOpen = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: { name: 'settings' } });
  }, []);

  // ── Command Palette callbacks ──────────────────────────────────────────────

  const handleCommandPaletteClose = useCallback(() => {
    dispatch({ type: 'CLOSE_COMMAND_PALETTE' });
  }, []);

  const handleCommandPaletteSelect = useCallback((prompt: PromptRecipe) => {
    const variables = extractVariables(prompt.body);
    dispatch({ type: 'CLOSE_COMMAND_PALETTE' });

    if (variables.length > 0) {
      // Prompt has variables → open VariableFillModal
      dispatch({ type: 'OPEN_VARIABLE_FILL', promptId: prompt.id });
    } else {
      // No variables → copy body directly
      // TODO: wire to Tauri clipboard write command for native clipboard access
      navigator.clipboard?.writeText(prompt.body).catch(() => {
        // Clipboard API may not be available in all contexts
        console.log('Copy to clipboard:', prompt.body);
      });
    }
  }, []);

  // ── Variable Fill Modal callbacks ──────────────────────────────────────────

  const handleVariableFillCancel = useCallback(() => {
    dispatch({ type: 'CLOSE_VARIABLE_FILL' });
  }, []);

  const handleVariableFillCopy = useCallback((renderedText: string) => {
    // TODO: wire to Tauri clipboard write command for native clipboard access
    navigator.clipboard?.writeText(renderedText).catch(() => {
      console.log('Copy to clipboard:', renderedText);
    });
  }, []);

  const handleVariableFillPaste = useCallback((renderedText: string) => {
    // TODO: wire to Tauri clipboard paste command for native paste-into-app
    console.log('Paste rendered text:', renderedText);
  }, []);

  // TODO: replace with repository call for backend persistence
  // TODO: wire to Tauri clipboard command for native clipboard access
  // TODO: wire to AuthService for Firebase auth integration

  // ── Determine if Inspector should show ─────────────────────────────────────

  const showInspector =
    state.screen.name === 'library' && selectedPrompt !== null;

  // ── Render ─────────────────────────────────────────────────────────────────

  // Onboarding takes the full screen — no TopBar, Sidebar, or Inspector
  if (state.screen.name === 'onboarding') {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
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
        searchQuery={state.searchQuery}
        onSearchChange={handleSearchChange}
        onCommandPaletteOpen={handleCommandPaletteOpen}
        onSettingsOpen={handleSettingsOpen}
      />

      {/* Body: Sidebar + Main Content + Inspector */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={state.folders}
          activeItem={state.activeSidebarItem}
          onItemSelect={handleSidebarItemSelect}
          promptCountByFolder={promptCountByFolder}
          onSettingsOpen={handleSettingsOpen}
        />

        {/* Main Content Area */}
        <main
          className="flex flex-1 flex-col overflow-y-auto pt-14"
          style={{ color: 'var(--color-text-main)' }}
        >
          {state.screen.name === 'library' && (
            <LibraryScreen
              prompts={filteredPrompts}
              selectedPromptId={state.selectedPromptId}
              activeFilter={state.activeFilter}
              onSelectPrompt={handleSelectPrompt}
              onToggleFavorite={handleToggleFavorite}
              onFilterChange={handleFilterChange}
              onNewPrompt={handleNewPrompt}
              categoryColorMap={categoryColorMap}
            />
          )}

          {state.screen.name === 'editor' && (
            <PromptEditor
              promptId={state.screen.promptId}
              prompt={editorPrompt}
              folders={state.folders}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
            />
          )}

          {state.screen.name === 'settings' && (
            <SettingsScreen onBack={handleSettingsBack} />
          )}
        </main>

        {/* Inspector Panel — shown when a prompt is selected on Library screen */}
        {showInspector && selectedPrompt && (
          <div className="w-80 shrink-0 overflow-y-auto pt-14">
            <PromptInspector
              prompt={selectedPrompt}
              folder={selectedPromptFolder}
              variables={selectedPromptVariables}
            />
          </div>
        )}
      </div>

      {/* CommandPalette modal overlay */}
      <CommandPalette
        prompts={state.prompts}
        isOpen={state.commandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSelectPrompt={handleCommandPaletteSelect}
      />

      {/* VariableFillModal overlay */}
      {variableFillPrompt && variableFillVariables.length > 0 && (
        <VariableFillModal
          prompt={variableFillPrompt}
          variables={variableFillVariables}
          onCancel={handleVariableFillCancel}
          onCopy={handleVariableFillCopy}
          onPaste={handleVariableFillPaste}
        />
      )}
    </div>
  );
}
