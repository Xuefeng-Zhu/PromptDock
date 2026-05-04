import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useVirtualRows } from '../../hooks/use-virtual-rows';
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
  const columnCount = usePromptGridColumnCount(viewMode);
  const rowCount = Math.ceil(prompts.length / columnCount);
  const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
  const rowGap = viewMode === 'grid' ? GRID_ROW_GAP : LIST_ROW_GAP;
  const {
    containerRef,
    shouldVirtualize,
    totalSize,
    virtualRows,
  } = useVirtualRows<HTMLDivElement>({
    enabled: prompts.length > VIRTUALIZATION_THRESHOLD,
    rowCount,
    rowGap,
    rowHeight,
  });

  const gridClassName = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
    : 'flex flex-col gap-2';

  const virtualizedPromptRows = useMemo(
    () =>
      virtualRows.map((row) => ({
        ...row,
        prompts: prompts.slice(row.index * columnCount, row.index * columnCount + columnCount),
      })),
    [columnCount, prompts, virtualRows],
  );

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
        ref={containerRef}
        className="relative"
        role="listbox"
        aria-label="Prompt list"
        data-view-mode={viewMode}
        data-virtualized="true"
        style={{ height: totalSize }}
      >
        {virtualizedPromptRows.map((row) => (
          <div
            key={row.index}
            className={gridClassName}
            style={{
              height: row.size,
              left: 0,
              position: 'absolute',
              right: 0,
              top: row.start,
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
    );
  }

  return (
    <div
      ref={containerRef}
      className={gridClassName}
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
