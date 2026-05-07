import type { RefObject } from 'react';
import type { PromptRecipe } from '../../types/index';
import { PromptResultTags } from './PromptResultTags';
import { PromptSearchEmptyState } from './PromptSearchEmptyState';

interface CommandPaletteResultsProps {
  highlightedIndex: number;
  prompts: PromptRecipe[];
  resultsListRef: RefObject<HTMLUListElement | null>;
  onHighlight: (index: number) => void;
  onSelectPrompt: (prompt: PromptRecipe) => void;
}

export function CommandPaletteResults({
  highlightedIndex,
  prompts,
  resultsListRef,
  onHighlight,
  onSelectPrompt,
}: CommandPaletteResultsProps) {
  return (
    <ul
      ref={resultsListRef}
      role="listbox"
      aria-label="Search results"
      className="max-h-[min(60dvh,18rem)] overflow-y-auto py-1"
    >
      {prompts.length === 0 ? (
        <PromptSearchEmptyState variant="palette">No prompts found</PromptSearchEmptyState>
      ) : (
        prompts.map((prompt, index) => (
          <li
            key={prompt.id}
            role="option"
            aria-selected={index === highlightedIndex}
            className={[
              'flex min-h-14 cursor-pointer flex-col gap-0.5 px-4 py-2.5 transition-colors',
              index === highlightedIndex
                ? 'bg-[var(--color-primary-light)]'
                : 'hover:bg-gray-50',
            ].join(' ')}
            onClick={() => onSelectPrompt(prompt)}
            onMouseEnter={() => onHighlight(index)}
          >
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-main)' }}
            >
              {prompt.title}
            </span>
            <span
              className="line-clamp-2 text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {prompt.description}
            </span>
            <PromptResultTags tags={prompt.tags} variant="palette" />
          </li>
        ))
      )}
    </ul>
  );
}
