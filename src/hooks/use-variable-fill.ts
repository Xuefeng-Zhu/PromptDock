import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  areAllPromptVariablesFilled,
  renderPromptTemplate,
} from '../utils/prompt-template';
import type { PromptRecipe, UserSettings } from '../types/index';

interface UseVariableFillOptions {
  defaultAction: UserSettings['defaultAction'];
  onCancel: () => void;
  onCopy: (renderedText: string) => void | Promise<void>;
  onPaste: (renderedText: string) => void | Promise<void>;
  prompt: PromptRecipe;
  variables: string[];
}

export function useVariableFill({
  defaultAction,
  onCancel,
  onCopy,
  onPaste,
  prompt,
  variables,
}: UseVariableFillOptions) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const variable of variables) {
      initial[variable] = '';
    }
    return initial;
  });
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  const isComplete = useMemo(
    () => areAllPromptVariablesFilled(variables, values),
    [variables, values],
  );

  const renderedText = useMemo(
    () => renderPromptTemplate(prompt.body, values),
    [prompt.body, values],
  );

  const isPasteAction = defaultAction === 'paste';

  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleValueChange = useCallback((variableName: string, value: string) => {
    setValues((prev) => ({ ...prev, [variableName]: value }));
  }, []);

  const handleCopy = useCallback(() => {
    if (!isComplete) return;

    Promise.resolve(onCopy(renderedText))
      .then(() => {
        if (!mountedRef.current) return;
        setCopied(true);
        setTimeout(() => {
          if (mountedRef.current) {
            setCopied(false);
          }
        }, 2000);
      })
      .catch(() => {
        if (mountedRef.current) {
          setCopied(false);
        }
      });
  }, [isComplete, renderedText, onCopy]);

  const handlePrimaryAction = useCallback(() => {
    if (!isComplete) return;

    if (isPasteAction) {
      Promise.resolve(onPaste(renderedText)).catch(() => {});
      return;
    }

    handleCopy();
  }, [handleCopy, isComplete, isPasteAction, onPaste, renderedText]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key === 'Enter' && isComplete) {
        event.preventDefault();
        handlePrimaryAction();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrimaryAction, isComplete, onCancel]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === event.currentTarget) {
        onCancel();
      }
    },
    [onCancel],
  );

  return {
    copied,
    firstInputRef,
    handleBackdropClick,
    handlePrimaryAction,
    handleValueChange,
    isComplete,
    isPasteAction,
    renderedText,
    values,
  };
}
