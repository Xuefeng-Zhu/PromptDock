import { useMemo, useState } from 'react';
import type { Folder, PromptRecipe } from '../../types/index';
import { deriveFolderFilterOptions, deriveTagFilterOptions } from '../../utils/library-filter-options';
import {
  normalizePromptFilters,
  sortPromptsByFilter,
  type FilterType,
} from '../../utils/prompt-filters';
import { LibraryHeader } from './LibraryHeader';
import { PromptGridSkeleton } from './PromptGridSkeleton';
import type { LibraryViewMode } from './types';
import { PromptGrid } from './PromptGrid';
import { PromptFiltersPopover } from '../prompt-filters';
import { PromptSortDropdown } from './PromptSortDropdown';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface LibraryScreenProps {
  prompts: PromptRecipe[];
  filterSourcePrompts?: PromptRecipe[];
  folders?: Folder[];
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
  filterSourcePrompts,
  folders,
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
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const appliedFilters = useMemo(() => normalizePromptFilters(activeFilter), [activeFilter]);
  const displayCount = totalPromptCount ?? prompts.length;
  const filterOptionSourcePrompts = filterSourcePrompts ?? prompts;
  const folderFilterOptions = useMemo(
    () => deriveFolderFilterOptions(filterOptionSourcePrompts, folders),
    [filterOptionSourcePrompts, folders],
  );
  const tagFilterOptions = useMemo(
    () => deriveTagFilterOptions(filterOptionSourcePrompts),
    [filterOptionSourcePrompts],
  );

  const sortedPrompts = useMemo(
    () => sortPromptsByFilter(prompts, appliedFilters.sortBy),
    [appliedFilters.sortBy, prompts],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <LibraryHeader
          displayCount={displayCount}
          onNewPrompt={onNewPrompt}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
        />

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="relative z-20 mb-5 flex items-center justify-between gap-3">
          <PromptFiltersPopover
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            folderOptions={folderFilterOptions}
            tagOptions={tagFilterOptions}
          />
          <PromptSortDropdown
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* ── Prompt Grid ───────────────────────────────────────────────── */}
        {loading ? (
          <PromptGridSkeleton />
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
