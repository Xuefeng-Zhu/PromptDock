import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { usePromptExecution } from '../../hooks/use-prompt-execution';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import { usePromptSearchResults } from '../../hooks/use-prompt-search-results';
import { usePromptStore } from '../../stores/prompt-store';
import { useSettingsStore } from '../../stores/settings-store';
import { extractVariables } from '../../utils/prompt-template';
import { resolvePromptRecipeVariables } from '../../utils/prompt-variables';
import type { PromptRecipe } from '../../types/index';

function formatActionError(action: string, err: unknown): string {
  return `Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`;
}

export function useQuickLauncherController() {
  const prompts = usePromptStore((s) => s.prompts);
  const isLoading = usePromptStore((s) => s.isLoading);
  const loadPrompts = usePromptStore((s) => s.loadPrompts);
  const markPromptUsed = usePromptStore((s) => s.markPromptUsed);
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);

  const [query, setQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecipe | null>(null);
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

  const results = usePromptSearchResults(prompts, query);
  const {
    highlightedIndex: highlightIndex,
    moveHighlightedIndex,
    resetHighlightedIndex,
    setHighlightedIndex: setHighlightIndex,
  } = useHighlightedIndex(results.length, results);

  const hideWindow = useCallback(async () => {
    setQuery('');
    setSelectedPrompt(null);
    resetHighlightedIndex();
    setActionError(null);
    try {
      await invoke('toggle_quick_launcher');
    } catch {
      // May fail outside the Tauri runtime, including browser tests.
    }
  }, [resetHighlightedIndex]);

  const { copyText, pasteText } = usePromptExecution({
    defaultAction,
    markPromptUsed,
    beforePaste: hideWindow,
  });

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedPrompt) {
          setSelectedPrompt(null);
        } else {
          void hideWindow();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPrompt, hideWindow]);

  const copyAndClose = useCallback(async (text: string, promptId?: string) => {
    setActionError(null);
    try {
      await copyText({ text, promptId, source: 'quick_launcher' });
      await hideWindow();
    } catch (err) {
      setActionError(formatActionError('copy prompt', err));
      throw err;
    }
  }, [copyText, hideWindow]);

  const pasteAndClose = useCallback(async (text: string, promptId?: string) => {
    setActionError(null);
    try {
      await pasteText({ text, promptId, source: 'quick_launcher' });
    } catch (err) {
      setActionError(formatActionError('paste prompt', err));
      throw err;
    }
  }, [pasteText]);

  const handleSelectPrompt = useCallback(
    (prompt: PromptRecipe) => {
      const variables = extractVariables(prompt.body);
      if (variables.length > 0) {
        setSelectedPrompt(prompt);
      } else if (defaultAction === 'paste') {
        void pasteAndClose(prompt.body, prompt.id).catch(() => {});
      } else {
        void copyAndClose(prompt.body, prompt.id).catch(() => {});
      }
    },
    [copyAndClose, defaultAction, pasteAndClose],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveHighlightedIndex(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveHighlightedIndex(-1);
      } else if (event.key === 'Enter' && results.length > 0) {
        event.preventDefault();
        const highlightedPrompt = results[highlightIndex] ?? results[0];
        handleSelectPrompt(highlightedPrompt);
      }
    },
    [results, highlightIndex, handleSelectPrompt, moveHighlightedIndex],
  );

  const selectedVariables = selectedPrompt
    ? resolvePromptRecipeVariables(selectedPrompt)
    : [];

  return {
    actionError,
    copyAndClose,
    defaultAction,
    handleSearchKeyDown,
    handleSelectPrompt,
    highlightIndex,
    isLoading,
    pasteAndClose,
    prompts,
    query,
    results,
    searchInputRef,
    selectedPrompt,
    selectedVariables,
    setHighlightIndex,
    setQuery,
    setSelectedPrompt,
  };
}
