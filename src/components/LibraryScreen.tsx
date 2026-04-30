import { useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
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
}

// ─── Filter Chip Config ────────────────────────────────────────────────────────

const FILTER_CHIPS: { label: string; value: FilterType | 'filters' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Recent', value: 'recent' },
  { label: 'Filters', value: 'filters' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Library screen composing the header, filter chips, and PromptGrid.
 * Renders the main prompt browsing view with:
 * - Header: "All Prompts" title, prompt count, grid/list view toggle, "+ New Prompt" button
 * - Filter chips: All, Favorites, Recent, Filters
 * - PromptGrid with filtered prompts
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function LibraryScreen({
  prompts,
  selectedPromptId,
  activeFilter,
  onSelectPrompt,
  onToggleFavorite,
  onFilterChange,
  onNewPrompt,
  categoryColorMap,
}: LibraryScreenProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-main)' }}
          >
            All Prompts
          </h1>
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / List view toggle */}
          <div
            className="flex rounded-lg border"
            style={{ borderColor: 'var(--color-border)' }}
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
                'flex items-center justify-center rounded-r-lg border-l p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
              ].join(' ')}
              style={{ borderColor: 'var(--color-border)' }}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* New Prompt button */}
          <Button variant="primary" size="sm" onClick={onNewPrompt}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Prompt
          </Button>
        </div>
      </div>

      {/* ── Filter Chips ────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-2" role="group" aria-label="Filter prompts">
        {FILTER_CHIPS.map((chip) => {
          // "Filters" chip is a placeholder — not a real FilterType
          const isActive =
            chip.value !== 'filters' && activeFilter === chip.value;

          return (
            <button
              key={chip.value}
              onClick={() => {
                if (chip.value !== 'filters') {
                  onFilterChange(chip.value);
                }
                // "Filters" chip is a placeholder for future advanced filters
              }}
              className={[
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Prompt Grid ─────────────────────────────────────────────────────── */}
      <PromptGrid
        prompts={prompts}
        selectedPromptId={selectedPromptId}
        onSelectPrompt={onSelectPrompt}
        onToggleFavorite={onToggleFavorite}
        categoryColorMap={categoryColorMap}
      />
    </div>
  );
}
