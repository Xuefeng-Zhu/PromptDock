import { useMemo, useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import type { PromptRecipe } from '../types/index';
import {
  normalizePromptFilters,
  sortPromptsByFilter,
  type FilterType,
} from '../utils/prompt-filters';
import { Button } from './ui/Button';
import { PromptGrid } from './PromptGrid';
import { getSortFilterLabel, PromptFiltersPopover } from './PromptFiltersPopover';

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
  const appliedFilters = useMemo(() => normalizePromptFilters(activeFilter), [activeFilter]);
  const displayCount = totalPromptCount ?? prompts.length;

  const sortedPrompts = useMemo(
    () => sortPromptsByFilter(prompts, appliedFilters.sortBy),
    [appliedFilters.sortBy, prompts],
  );

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

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="relative z-20 mb-5 flex items-center justify-between gap-3">
          <PromptFiltersPopover
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            Sorted by {getSortFilterLabel(appliedFilters.sortBy)}
          </span>
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
    </div>
  );
}
