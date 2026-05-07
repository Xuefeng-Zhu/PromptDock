import { useState, useEffect, useRef, useCallback } from 'react';
import type { PromptRecipe } from '../../types/index';
import type { SearchOptions } from '../../services/search-engine';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import { CommandPaletteResults } from './CommandPaletteResults';
import { CommandPaletteSearchField } from './CommandPaletteSearchField';
import { PromptSearchShortcutHints } from './PromptSearchShortcutHints';
import { useSearchOverlayFocus } from './useSearchOverlayFocus';
import {
  searchPromptResults,
  usePromptSearchResults,
} from '../../hooks/use-prompt-search-results';

export { clampIndex } from '../../utils/list-navigation';

// ─── Exported Utility Functions ────────────────────────────────────────────────

const COMMAND_PALETTE_SEARCH_OPTIONS: SearchOptions = {
  fields: ['title', 'tags', 'description'],
};

/**
 * Filters prompts for the command palette by case-insensitive substring match
 * against title, description, and tags.
 */
export function filterCommandPaletteResults(
  prompts: PromptRecipe[],
  query: string,
): PromptRecipe[] {
  return searchPromptResults(prompts, query, COMMAND_PALETTE_SEARCH_OPTIONS);
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface CommandPaletteProps {
  prompts: PromptRecipe[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: PromptRecipe) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Modal command palette overlay triggered by ⌘K.
 * Provides rapid prompt search with keyboard navigation (↑↓ Enter Esc).
 * Uses a <dialog> element with role="dialog" and aria-modal="true".
 * Saves and restores focus to the previously focused element on close.
 */
export function CommandPalette({
  prompts,
  isOpen,
  onClose,
  onSelectPrompt,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useSearchOverlayFocus(isOpen);

  const filtered = usePromptSearchResults(prompts, query, COMMAND_PALETTE_SEARCH_OPTIONS);
  const {
    highlightedIndex,
    moveHighlightedIndex,
    resetHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(filtered.length);

  // ── Reset query and highlight when opening ─────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      resetHighlightedIndex();
    }
  }, [isOpen, resetHighlightedIndex]);

  // ── Scroll highlighted item into view ──────────────────────────────────────

  useEffect(() => {
    if (!resultsListRef.current) return;
    const items = resultsListRef.current.children;
    if (items[highlightedIndex]) {
      (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // ── Keyboard handler ───────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveHighlightedIndex(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveHighlightedIndex(-1);
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered.length > 0 && filtered[highlightedIndex]) {
            onSelectPrompt(filtered[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, highlightedIndex, moveHighlightedIndex, onSelectPrompt, onClose],
  );

  // ── Backdrop click handler ─────────────────────────────────────────────────

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the backdrop itself, not the dialog content
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // ── Don't render when closed ───────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-3 py-3 animate-[fadeIn_150ms_ease-out] sm:pt-[15vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleBackdropClick}
      data-testid="command-palette-backdrop"
    >
      <dialog
        ref={dialogRef}
        open
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative m-0 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-2xl animate-[slideDown_150ms_ease-out]"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
        onKeyDown={handleKeyDown}
      >
        <CommandPaletteSearchField
          inputRef={searchInputRef}
          query={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <CommandPaletteResults
          highlightedIndex={highlightedIndex}
          prompts={filtered}
          resultsListRef={resultsListRef}
          onHighlight={setHighlightedIndex}
          onSelectPrompt={onSelectPrompt}
        />

        <PromptSearchShortcutHints variant="palette" />
      </dialog>
    </div>
  );
}
