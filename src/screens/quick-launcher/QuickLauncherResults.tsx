import { useEffect, type CSSProperties } from 'react';
import { useVirtualRows } from '../../hooks/use-virtual-rows';
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

export function QuickLauncherResults({
  highlightIndex,
  isLoading,
  prompts,
  query,
  results,
  onHighlightPrompt,
  onSelectPrompt,
}: QuickLauncherResultsProps) {
  const {
    containerRef,
    scrollToRow,
    shouldVirtualize,
    totalSize,
    virtualRows,
  } = useVirtualRows<HTMLDivElement>({
    enabled: results.length > VIRTUALIZATION_THRESHOLD,
    rowCount: results.length,
    rowHeight: RESULT_ROW_HEIGHT,
    scrollElement: 'self',
  });

  useEffect(() => {
    if (shouldVirtualize) {
      scrollToRow(highlightIndex);
    }
  }, [highlightIndex, scrollToRow, shouldVirtualize]);

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

  return (
    <div
      ref={containerRef}
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
        <div className="relative" style={{ height: totalSize }}>
          {virtualRows.map((row) => {
            const prompt = results[row.index];
            if (!prompt) return null;

            return renderResult(prompt, row.index, {
              height: row.size,
              left: 0,
              position: 'absolute',
              right: 0,
              top: row.start,
            });
          })}
        </div>
      ) : (
        results.map((prompt, index) => renderResult(prompt, index))
      )}
    </div>
  );
}
