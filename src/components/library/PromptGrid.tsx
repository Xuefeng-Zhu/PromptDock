import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';
import { PromptCard } from '../prompt-card';
import { EmptyState } from '../shared';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptGridProps {
  prompts: PromptRecipe[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  categoryColorMap: Record<string, string>;
  viewMode?: 'grid' | 'list';
}

const VIRTUALIZATION_THRESHOLD = 80;
const GRID_ROW_HEIGHT = 200;
const LIST_ROW_HEIGHT = 108;
const GRID_ROW_GAP = 16;
const LIST_ROW_GAP = 8;
const OVERSCAN_ROWS = 4;
const INITIAL_VIRTUAL_VIEWPORT_HEIGHT = 720;

function getColumnCount(viewMode: 'grid' | 'list'): number {
  if (viewMode === 'list') return 1;
  if (typeof window === 'undefined') return 1;
  return window.innerWidth >= 768 ? 2 : 1;
}

function usePromptGridColumnCount(viewMode: 'grid' | 'list'): number {
  const [columnCount, setColumnCount] = useState(() => getColumnCount(viewMode));

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getColumnCount(viewMode));
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, [viewMode]);

  return columnCount;
}

function createInitialVirtualRows(rowCount: number, rowHeight: number, rowGap: number) {
  const visibleRowCount = Math.min(
    rowCount,
    Math.ceil(INITIAL_VIRTUAL_VIEWPORT_HEIGHT / (rowHeight + rowGap)) + OVERSCAN_ROWS,
  );

  return Array.from({ length: visibleRowCount }, (_, index) => ({
    index,
    key: index,
    size: rowHeight,
    start: index * (rowHeight + rowGap),
  }));
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Two-column responsive grid of PromptCards. Displays an EmptyState
 * placeholder when the prompts array is empty.
 *
 * The `categoryColorMap` maps prompt IDs to Tailwind class strings
 * (e.g. "bg-purple-100 text-purple-600") used for the card's IconTile.
 */
export function PromptGrid({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onToggleFavorite,
  categoryColorMap,
  viewMode = 'grid',
}: PromptGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnCount = usePromptGridColumnCount(viewMode);
  const rowCount = Math.ceil(prompts.length / columnCount);
  const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
  const rowGap = viewMode === 'grid' ? GRID_ROW_GAP : LIST_ROW_GAP;
  const shouldVirtualize = prompts.length > VIRTUALIZATION_THRESHOLD;
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: rowCount,
    enabled: shouldVirtualize,
    estimateSize: () => rowHeight,
    gap: rowGap,
    getItemKey: (index) => prompts[index * columnCount]?.id ?? index,
    getScrollElement: () => scrollContainerRef.current,
    initialRect: { height: INITIAL_VIRTUAL_VIEWPORT_HEIGHT, width: 1024 },
    overscan: OVERSCAN_ROWS,
  });

  const virtualRowClassName = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
    : 'flex flex-col gap-2';
  const promptListClassName = viewMode === 'grid'
    ? 'grid auto-rows-max grid-cols-1 content-start items-start gap-4 md:grid-cols-2'
    : 'flex flex-col gap-2';

  const virtualRows = rowVirtualizer.getVirtualItems();
  const renderedVirtualRows = virtualRows.length > 0
    ? virtualRows
    : createInitialVirtualRows(rowCount, rowHeight, rowGap);

  const virtualizedPromptRows = renderedVirtualRows.map((row) => ({
    ...row,
    prompts: prompts.slice(row.index * columnCount, row.index * columnCount + columnCount),
  }));

  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10" />}
        title="No prompts found"
        description="Try adjusting your search or filters to find what you're looking for."
      />
    );
  }

  if (shouldVirtualize) {
    return (
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Prompt list"
        data-view-mode={viewMode}
        data-virtualized="true"
      >
        <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
          {virtualizedPromptRows.map((row) => (
            <div
              key={row.key}
              className={virtualRowClassName}
              data-index={row.index}
              ref={rowVirtualizer.measureElement}
              style={{
                height: row.size,
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
                transform: `translateY(${row.start}px)`,
              }}
            >
              {row.prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  className="h-full overflow-hidden"
                  prompt={prompt}
                  categoryColor={categoryColorMap[prompt.id] ?? ''}
                  isSelected={prompt.id === selectedPromptId}
                  onSelect={onSelectPrompt}
                  onToggleFavorite={onToggleFavorite}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={`min-h-0 flex-1 overflow-y-auto ${promptListClassName}`}
      role="listbox"
      aria-label="Prompt list"
      data-view-mode={viewMode}
      data-virtualized="false"
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          categoryColor={categoryColorMap[prompt.id] ?? ''}
          isSelected={prompt.id === selectedPromptId}
          onSelect={onSelectPrompt}
          onToggleFavorite={onToggleFavorite}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
