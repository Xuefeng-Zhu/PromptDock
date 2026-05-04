import { useEffect, useRef, type CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptResultTags, PromptSearchEmptyState } from '../../components/prompt-search';
import type { PromptRecipe } from '../../types/index';

interface QuickLauncherResultsProps {
  highlightIndex: number;
  isLoading: boolean;
  prompts: PromptRecipe[];
  query: string;
  results: PromptRecipe[];
  onHighlightPrompt: (index: number) => void;
  onSelectPrompt: (prompt: PromptRecipe) => void;
}

const VIRTUALIZATION_THRESHOLD = 80;
const RESULT_ROW_HEIGHT = 76;
const OVERSCAN_ROWS = 5;
const INITIAL_VIRTUAL_VIEWPORT_HEIGHT = 480;

function createInitialVirtualRows(rowCount: number) {
  const visibleRowCount = Math.min(
    rowCount,
    Math.ceil(INITIAL_VIRTUAL_VIEWPORT_HEIGHT / RESULT_ROW_HEIGHT) + OVERSCAN_ROWS,
  );

  return Array.from({ length: visibleRowCount }, (_, index) => ({
    index,
    key: index,
    size: RESULT_ROW_HEIGHT,
    start: index * RESULT_ROW_HEIGHT,
  }));
}

export function QuickLauncherResults({
  highlightIndex,
  isLoading,
  prompts,
  query,
  results,
  onHighlightPrompt,
  onSelectPrompt,
}: QuickLauncherResultsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = results.length > VIRTUALIZATION_THRESHOLD;
  const resultVirtualizer = useVirtualizer<HTMLDivElement, HTMLButtonElement>({
    count: results.length,
    enabled: shouldVirtualize,
    estimateSize: () => RESULT_ROW_HEIGHT,
    getItemKey: (index) => results[index]?.id ?? index,
    getScrollElement: () => scrollContainerRef.current,
    initialRect: { height: INITIAL_VIRTUAL_VIEWPORT_HEIGHT, width: 640 },
    overscan: OVERSCAN_ROWS,
  });

  useEffect(() => {
    if (shouldVirtualize) {
      resultVirtualizer.scrollToIndex(highlightIndex, { align: 'auto' });
    }
  }, [highlightIndex, resultVirtualizer, shouldVirtualize]);

  const renderResult = (
    prompt: PromptRecipe,
    index: number,
    style?: CSSProperties,
  ) => (
    <button
      key={prompt.id}
      type="button"
      role="option"
      aria-selected={index === highlightIndex}
      aria-posinset={index + 1}
      aria-setsize={results.length}
      onClick={() => onSelectPrompt(prompt)}
      onMouseEnter={() => onHighlightPrompt(index)}
      className={`w-full cursor-pointer border-b border-gray-100 px-4 py-2.5 text-left transition-colors dark:border-gray-700 ${
        index === highlightIndex
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
      style={style}
    >
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {prompt.title}
        </span>
        {prompt.favorite && (
          <span className="text-xs text-yellow-500" aria-label="Favorite">
            ★
          </span>
        )}
      </div>
      {prompt.description && (
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
          {prompt.description}
        </p>
      )}
      <PromptResultTags tags={prompt.tags} variant="launcher" />
    </button>
  );

  const virtualRows = resultVirtualizer.getVirtualItems();
  const renderedVirtualRows = virtualRows.length > 0
    ? virtualRows
    : createInitialVirtualRows(results.length);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto"
      role="listbox"
      aria-label="Search results"
      data-virtualized={shouldVirtualize ? 'true' : 'false'}
    >
      {isLoading && prompts.length === 0 ? (
        <PromptSearchEmptyState variant="launcher">Loading prompts…</PromptSearchEmptyState>
      ) : results.length === 0 ? (
        <PromptSearchEmptyState variant="launcher">
          {query.trim() ? 'No prompts found.' : 'Start typing to search…'}
        </PromptSearchEmptyState>
      ) : shouldVirtualize ? (
        <div className="relative" style={{ height: resultVirtualizer.getTotalSize() }}>
          {renderedVirtualRows.map((row) => {
            const prompt = results[row.index];
            if (!prompt) return null;

            return renderResult(prompt, row.index, {
              height: row.size,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
              transform: `translateY(${row.start}px)`,
            });
          })}
        </div>
      ) : (
        results.map((prompt, index) => renderResult(prompt, index))
      )}
    </div>
  );
}
