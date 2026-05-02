import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SearchEngine } from '../services/search-engine';
import { VariableParser } from '../services/variable-parser';
import { VariableFillModal } from '../components/VariableFillModal';
import { usePromptStore } from '../stores/prompt-store';
import { useSettingsStore } from '../stores/settings-store';
import { copyToClipboard, pasteToActiveApp } from '../utils/clipboard';
import { trackPromptAction } from '../services/analytics-service';
import type { PromptRecipe } from '../types/index';

// ─── Singleton instances ───────────────────────────────────────────────────────

const searchEngine = new SearchEngine();
const variableParser = new VariableParser();

function formatActionError(action: string, err: unknown): string {
  return `Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * QuickLauncherWindow — a compact, always-on-top overlay for rapid prompt
 * search and selection. Activated via the global hotkey (Cmd+Shift+P /
 * Ctrl+Shift+P). This component is rendered in a separate Tauri window
 * (label: "quick-launcher").
 */
export function QuickLauncherWindow() {
  const prompts = usePromptStore((s) => s.prompts);
  const isLoading = usePromptStore((s) => s.isLoading);
  const loadPrompts = usePromptStore((s) => s.loadPrompts);
  const markPromptUsed = usePromptStore((s) => s.markPromptUsed);
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);

  const [query, setQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecipe | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const promptCountRef = useRef(prompts.length);

  useEffect(() => {
    promptCountRef.current = prompts.length;
  }, [prompts.length]);

  const refreshPrompts = useCallback(async () => {
    try {
      await loadPrompts();
    } catch (err) {
      setActionError(formatActionError('load prompts', err));
    }
  }, [loadPrompts]);

  // ── Auto-focus search input and refresh prompts when shown ───────────────
  useEffect(() => {
    const focusAndRefresh = () => {
      searchInputRef.current?.focus();
      void refreshPrompts();
    };

    searchInputRef.current?.focus();
    if (promptCountRef.current === 0) {
      void refreshPrompts();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        focusAndRefresh();
      }
    };

    window.addEventListener('focus', focusAndRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', focusAndRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPrompts]);

  // ── Search results ───────────────────────────────────────────────────────
  const results = useMemo(
    () => searchEngine.search(prompts, query),
    [prompts, query],
  );

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(0);
  }, [results]);

  // ── Hide window helper ─────────────────────────────────────────────────
  const hideWindow = useCallback(async () => {
    setQuery('');
    setSelectedPrompt(null);
    setHighlightIndex(0);
    setActionError(null);
    try {
      await invoke('toggle_quick_launcher');
    } catch {
      // Silently ignore — may fail outside Tauri runtime (e.g. tests)
    }
  }, []);

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPrompt) {
          // If variable fill modal is open, close it first
          setSelectedPrompt(null);
        } else {
          hideWindow();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPrompt, hideWindow]);

  // ── Copy to clipboard and close ──────────────────────────────────────────
  const markUsed = useCallback((promptId?: string) => {
    if (!promptId) return;
    void markPromptUsed(promptId).catch((err: unknown) => {
      console.error('Failed to update last used timestamp:', err);
    });
  }, [markPromptUsed]);

  const copyAndClose = useCallback(async (text: string, promptId?: string) => {
    setActionError(null);
    try {
      await copyToClipboard(text);
      markUsed(promptId);
      trackPromptAction('copied', { source: 'quick_launcher' });
      await hideWindow();
    } catch (err) {
      setActionError(formatActionError('copy prompt', err));
      throw err;
    }
  }, [hideWindow, markUsed]);

  // ── Paste into active app ────────────────────────────────────────────────
  const pasteAndClose = useCallback(async (text: string, promptId?: string) => {
    setActionError(null);
    try {
      const result = await pasteToActiveApp(text, hideWindow);
      markUsed(promptId);
      trackPromptAction(result.pasted ? 'pasted' : 'copied', { source: 'quick_launcher' });
    } catch (err) {
      setActionError(formatActionError('paste prompt', err));
      throw err;
    }
  }, [hideWindow, markUsed]);

  // ── Handle prompt selection ──────────────────────────────────────────────
  const handleSelectPrompt = useCallback(
    (prompt: PromptRecipe) => {
      const variables = variableParser.parse(prompt.body);
      if (variables.length > 0) {
        setSelectedPrompt(prompt);
      } else if (defaultAction === 'paste') {
        void pasteAndClose(prompt.body, prompt.id).catch(() => {});
      } else {
        // No variables — copy body directly and close
        void copyAndClose(prompt.body, prompt.id).catch(() => {});
      }
    },
    [copyAndClose, defaultAction, pasteAndClose],
  );

  // ── Keyboard navigation in results list ──────────────────────────────────
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const highlightedPrompt = results[highlightIndex] ?? results[0];
        handleSelectPrompt(highlightedPrompt);
      }
    },
    [results, highlightIndex, handleSelectPrompt],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  // If a prompt with variables is selected, show the variable fill modal inline
  if (selectedPrompt) {
    const variables = variableParser.parse(selectedPrompt.body);
    return (
      <div className="flex h-screen flex-col bg-white dark:bg-gray-800">
        {actionError && (
          <div
            role="alert"
            className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
          >
            {actionError}
          </div>
        )}
        <VariableFillModal
          prompt={selectedPrompt}
          variables={variables}
          defaultAction={defaultAction}
          onCopy={(renderedText) => copyAndClose(renderedText, selectedPrompt.id)}
          onPaste={(renderedText) => pasteAndClose(renderedText, selectedPrompt.id)}
          onCancel={() => setSelectedPrompt(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-800">
      {/* Search input */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search prompts…"
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          aria-label="Search prompts"
          autoFocus
        />
        {actionError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-300">
            {actionError}
          </p>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Search results">
        {isLoading && prompts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            Loading prompts…
          </div>
        ) : results.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {query.trim() ? 'No prompts found.' : 'Start typing to search…'}
          </div>
        ) : (
          results.map((prompt, index) => (
            <button
              key={prompt.id}
              type="button"
              role="option"
              aria-selected={index === highlightIndex}
              onClick={() => handleSelectPrompt(prompt)}
              onMouseEnter={() => setHighlightIndex(index)}
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
              {prompt.tags.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      +{prompt.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-gray-200 px-4 py-1.5 dark:border-gray-700">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">↑↓</kbd>{' '}
          navigate{' '}
          <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">Enter</kbd>{' '}
          select{' '}
          <kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">Esc</kbd>{' '}
          close
        </p>
      </div>
    </div>
  );
}
