import { useState } from 'react';
import { LayoutGrid, List, Plus, Star, Clock, SlidersHorizontal, ChevronDown } from 'lucide-react';
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
}: LibraryScreenProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const displayCount = totalPromptCount ?? prompts.length;

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

            {/* New Prompt split button */}
            <div className="flex">
              <Button
                variant="primary"
                size="sm"
                className="rounded-r-none"
                onClick={onNewPrompt}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Prompt
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="rounded-l-none border-l border-white/20 px-2"
                aria-label="New prompt options"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
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
          {/* Filters button */}
          <button
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50 transition-colors ml-auto"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
          </button>
        </div>

        {/* ── Prompt Grid ───────────────────────────────────────────────── */}
        <PromptGrid
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={onSelectPrompt}
          onToggleFavorite={onToggleFavorite}
          categoryColorMap={categoryColorMap}
        />
      </div>

      {/* ── Bottom Status Bar ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-t px-6 py-2 text-xs text-[var(--color-text-muted)]"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
      >
        <span>{displayCount} prompts</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-main)] transition-colors"
        >
          Sorted by Last used
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
