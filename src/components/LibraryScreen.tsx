import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Plus, Star, Clock, ChevronDown } from 'lucide-react';
import type { PromptRecipe } from '../types/index';
import type { FilterType } from './AppShell';
import { Button } from './ui/Button';
import { PromptGrid } from './PromptGrid';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface LibraryScreenProps {
  prompts: PromptRecipe[];
  selectedPromptId: string | null;
  activeFilter: FilterType;
  onSelectPrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onNewPrompt: () => void;
  categoryColorMap: Record<string, string>;
  totalPromptCount?: number;
  loading?: boolean;
}

// ─── Filter Chip Config ────────────────────────────────────────────────────────

interface FilterChip {
  label: string;
  value: FilterType | 'filters';
  icon?: React.ReactNode;
}

const FILTER_CHIPS: FilterChip[] = [
  { label: 'All', value: 'all' },
  { label: 'Favorites', value: 'favorites', icon: <Star className="h-3 w-3" /> },
  { label: 'Recent', value: 'recent', icon: <Clock className="h-3 w-3" /> },
];

type SortMode = 'lastUsed' | 'updated' | 'title';

const SORT_LABELS: Record<SortMode, string> = {
  lastUsed: 'Last used',
  updated: 'Updated',
  title: 'Title',
};

function getLastUsedSortValue(prompt: PromptRecipe): number {
  return prompt.lastUsedAt?.getTime() ?? 0;
}

function getUpdatedSortValue(prompt: PromptRecipe): number {
  return prompt.updatedAt.getTime();
}

function sortPrompts(prompts: PromptRecipe[], sortMode: SortMode): PromptRecipe[] {
  return [...prompts].sort((a, b) => {
    if (sortMode === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }

    const primaryA = sortMode === 'lastUsed' ? getLastUsedSortValue(a) : getUpdatedSortValue(a);
    const primaryB = sortMode === 'lastUsed' ? getLastUsedSortValue(b) : getUpdatedSortValue(b);
    if (primaryA !== primaryB) return primaryB - primaryA;

    const updatedDiff = getUpdatedSortValue(b) - getUpdatedSortValue(a);
    if (updatedDiff !== 0) return updatedDiff;

    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LibraryScreen({
  prompts,
  selectedPromptId,
  activeFilter,
  onSelectPrompt,
  onToggleFavorite,
  onFilterChange,
  onNewPrompt,
  categoryColorMap,
  totalPromptCount,
  loading = false,
}: LibraryScreenProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('lastUsed');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const displayCount = totalPromptCount ?? prompts.length;

  const sortedPrompts = useMemo(
    () => sortPrompts(prompts, sortMode),
    [prompts, sortMode],
  );

  useEffect(() => {
    if (!sortMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortMenuOpen]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-[var(--color-text-main)]">
              All Prompts
            </h1>
            <span className="text-sm text-[var(--color-text-muted)]">
              {displayCount} prompts
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Grid / List view toggle */}
            <div
              className="flex rounded-lg border border-[var(--color-border)]"
              role="group"
              aria-label="View mode"
            >
              <button
                onClick={() => setViewMode('grid')}
                className={[
                  'flex items-center justify-center rounded-l-lg p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
                ].join(' ')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={[
                  'flex items-center justify-center rounded-r-lg border-l border-[var(--color-border)] p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
                ].join(' ')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onNewPrompt}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Prompt
            </Button>
          </div>
        </div>

        {/* ── Filter Chips ──────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-2" role="group" aria-label="Filter prompts">
          {FILTER_CHIPS.map((chip) => {
            const isActive = chip.value !== 'filters' && activeFilter === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => {
                  if (chip.value !== 'filters') {
                    onFilterChange(chip.value);
                  }
                }}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
                ].join(' ')}
                aria-pressed={isActive}
              >
                {chip.icon}
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── Prompt Grid ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading prompts">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
                data-testid="skeleton-card"
              >
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-4 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PromptGrid
            prompts={sortedPrompts}
            selectedPromptId={selectedPromptId}
            onSelectPrompt={onSelectPrompt}
            onToggleFavorite={onToggleFavorite}
            categoryColorMap={categoryColorMap}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* ── Bottom Status Bar ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-t px-6 py-2 text-xs text-[var(--color-text-muted)]"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
      >
        <span>{displayCount} prompts</span>
        <div className="relative" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setSortMenuOpen((open) => !open)}
            className="inline-flex items-center gap-1 hover:text-[var(--color-text-main)] transition-colors"
            aria-haspopup="menu"
            aria-expanded={sortMenuOpen}
          >
            Sorted by {SORT_LABELS[sortMode]}
            <ChevronDown className="h-3 w-3" />
          </button>
          {sortMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 mb-1 w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sortMode === mode}
                  onClick={() => {
                    setSortMode(mode);
                    setSortMenuOpen(false);
                  }}
                  className={[
                    'flex w-full items-center px-3 py-2 text-left text-xs transition-colors',
                    sortMode === mode
                      ? 'font-medium text-[var(--color-primary)]'
                      : 'text-[var(--color-text-main)] hover:bg-gray-50',
                  ].join(' ')}
                >
                  {SORT_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
