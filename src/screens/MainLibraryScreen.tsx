import { useMemo } from 'react';
import { usePromptStore } from '../stores/prompt-store';
import { useAppModeStore } from '../stores/app-mode-store';
import { SearchEngine } from '../services/search-engine';
import { SearchBar } from '../components/SearchBar';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { PromptCard } from '../components/PromptCard';
import { ConflictBadge } from './ConflictCenter';
import type { Folder } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface MainLibraryScreenProps {
  /** Available folders for the sidebar filter. */
  folders?: Folder[];
  /** Called when the user wants to edit a prompt. */
  onEditPrompt?: (id: string) => void;
  /** Called when the user clicks "Sign in to sync". */
  onSignInClick?: () => void;
  /** Number of unresolved sync conflicts (Synced Mode only). */
  conflictCount?: number;
  /** Called when the user clicks the conflict badge. */
  onConflictClick?: () => void;
}

// ─── Singleton search engine ───────────────────────────────────────────────────

const searchEngine = new SearchEngine();

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Main Library Screen — the default view on launch.
 *
 * Displays the prompt library with:
 * - SyncStatusBar in the header
 * - SearchBar for filtering
 * - Folder sidebar for folder-based filtering
 * - Favorite filter toggle
 * - List of PromptCards
 */
export function MainLibraryScreen({
  folders = [],
  onEditPrompt,
  onSignInClick,
  conflictCount = 0,
  onConflictClick,
}: MainLibraryScreenProps) {
  // ── Store state ────────────────────────────────────────────────────────────
  const prompts = usePromptStore((s) => s.prompts);
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const folderFilter = usePromptStore((s) => s.folderFilter);
  const favoriteFilter = usePromptStore((s) => s.favoriteFilter);
  const setSearchQuery = usePromptStore((s) => s.setSearchQuery);
  const setFolderFilter = usePromptStore((s) => s.setFolderFilter);
  const setFavoriteFilter = usePromptStore((s) => s.setFavoriteFilter);
  const duplicatePrompt = usePromptStore((s) => s.duplicatePrompt);
  const toggleFavorite = usePromptStore((s) => s.toggleFavorite);
  const archivePrompt = usePromptStore((s) => s.archivePrompt);

  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const lastSyncedAt = useAppModeStore((s) => s.lastSyncedAt);

  // ── Derived: filtered & searched prompts ───────────────────────────────────
  const filteredPrompts = useMemo(() => {
    // 1. Search (also excludes archived)
    let results = searchEngine.search(prompts, searchQuery);

    // 2. Folder filter
    if (folderFilter !== null) {
      results = results.filter((p) => p.folderId === folderFilter);
    }

    // 3. Favorite filter
    if (favoriteFilter) {
      results = results.filter((p) => p.favorite);
    }

    return results;
  }, [prompts, searchQuery, folderFilter, favoriteFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEdit = (id: string) => onEditPrompt?.(id);
  const handleDuplicate = (id: string) => void duplicatePrompt(id);
  const handleToggleFavorite = (id: string) => void toggleFavorite(id);
  const handleArchive = (id: string) => void archivePrompt(id);

  // Placeholder callbacks — will be wired to Tauri commands later
  const handleCopy = (_id: string) => {
    // TODO: wire to Tauri clipboard command
  };
  const handlePaste = (_id: string) => {
    // TODO: wire to Tauri paste command
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* ── Folder sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden w-48 shrink-0 border-r border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 md:block">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Folders
        </h2>

        <button
          onClick={() => setFolderFilter(null)}
          className={`mb-1 block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
            folderFilter === null
              ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          All Prompts
        </button>

        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setFolderFilter(folder.id)}
            className={`mb-1 block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
              folderFilter === folder.id
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {folder.name}
          </button>
        ))}
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-lg font-bold">PromptDock</h1>
          <SyncStatusBar
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onSignInClick={onSignInClick}
          />
          <ConflictBadge count={conflictCount} onClick={onConflictClick} />
        </header>

        {/* Search + favorite filter */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={() => setFavoriteFilter(!favoriteFilter)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors ${
              favoriteFilter
                ? 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300'
                : 'border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            aria-label={favoriteFilter ? 'Show all prompts' : 'Show favorites only'}
            aria-pressed={favoriteFilter}
          >
            {favoriteFilter ? '★ Favorites' : '☆ Favorites'}
          </button>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchQuery
                  ? 'No prompts match your search.'
                  : 'No prompts yet. Create your first prompt!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onToggleFavorite={handleToggleFavorite}
                  onArchive={handleArchive}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
