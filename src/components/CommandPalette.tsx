import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { PromptRecipe } from '../types/index';
import type { SearchOptions } from '../services/search-engine';
import { useHighlightedIndex } from '../hooks/use-highlighted-index';
import { PromptResultTags } from './prompt-search/PromptResultTags';
import { PromptSearchEmptyState } from './prompt-search/PromptSearchEmptyState';
import { PromptSearchShortcutHints } from './prompt-search/PromptSearchShortcutHints';
import {
  searchPromptResults,
  usePromptSearchResults,
} from '../hooks/use-prompt-search-results';

export { clampIndex } from '../utils/list-navigation';

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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);

  const filtered = usePromptSearchResults(prompts, query, COMMAND_PALETTE_SEARCH_OPTIONS);
  const {
    highlightedIndex,
    moveHighlightedIndex,
    resetHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(filtered.length);

  // ── Save previous focus on open, restore on close ──────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element before the palette opens
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      // Auto-focus the search input
      // Use a small timeout to ensure the dialog is rendered before focusing
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timer);
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-[fadeIn_150ms_ease-out]"
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
        className="relative m-0 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-2xl animate-[slideDown_150ms_ease-out]"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            aria-label="Search prompts"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-placeholder)]"
            style={{ color: 'var(--color-text-main)' }}
          />
        </div>

        {/* Results list */}
        <ul
          ref={resultsListRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-72 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <PromptSearchEmptyState variant="palette">No prompts found</PromptSearchEmptyState>
          ) : (
            filtered.map((prompt, index) => (
              <li
                key={prompt.id}
                role="option"
                aria-selected={index === highlightedIndex}
                className={[
                  'flex cursor-pointer flex-col gap-0.5 px-4 py-2.5 transition-colors',
                  index === highlightedIndex
                    ? 'bg-[var(--color-primary-light)]'
                    : 'hover:bg-gray-50',
                ].join(' ')}
                onClick={() => onSelectPrompt(prompt)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-main)' }}
                >
                  {prompt.title}
                </span>
                <span
                  className="truncate text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {prompt.description}
                </span>
                <PromptResultTags tags={prompt.tags} variant="palette" />
              </li>
            ))
          )}
        </ul>

        <PromptSearchShortcutHints variant="palette" />
      </dialog>
    </div>
  );
}
