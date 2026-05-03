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

export function QuickLauncherResults({
  highlightIndex,
  isLoading,
  prompts,
  query,
  results,
  onHighlightPrompt,
  onSelectPrompt,
}: QuickLauncherResultsProps) {
  return (
    <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Search results">
      {isLoading && prompts.length === 0 ? (
        <PromptSearchEmptyState variant="launcher">Loading prompts…</PromptSearchEmptyState>
      ) : results.length === 0 ? (
        <PromptSearchEmptyState variant="launcher">
          {query.trim() ? 'No prompts found.' : 'Start typing to search…'}
        </PromptSearchEmptyState>
      ) : (
        results.map((prompt, index) => (
          <button
            key={prompt.id}
            type="button"
            role="option"
            aria-selected={index === highlightIndex}
            onClick={() => onSelectPrompt(prompt)}
            onMouseEnter={() => onHighlightPrompt(index)}
            className={`w-full cursor-pointer border-b border-gray-100 px-4 py-2.5 text-left transition-colors dark:border-gray-700 ${
              index === highlightIndex
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
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
        ))
      )}
    </div>
  );
}
