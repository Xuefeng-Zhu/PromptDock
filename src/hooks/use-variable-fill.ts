import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  areAllPromptVariablesFilled,
  renderPromptTemplate,
} from '../utils/prompt-template';
import type { PromptRecipe, PromptVariable, UserSettings } from '../types/index';

interface UseVariableFillOptions {
  defaultAction: UserSettings['defaultAction'];
  onCancel: () => void;
  onCopy: (renderedText: string) => void | Promise<void>;
  onPaste: (renderedText: string) => void | Promise<void>;
  prompt: PromptRecipe;
  variables: PromptVariable[];
}

/**
 * Manages the variable-fill modal state for a prompt template.
 * Defaults seed the initial values, rendered text preserves unresolved
 * placeholders, and async copy/paste callbacks are guarded against unmounts.
 */
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
      initial[variable.name] = variable.defaultValue;
    }
    return initial;
  });
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const variableNames = useMemo(
    () => variables.map((variable) => variable.name),
    [variables],
  );

  const isComplete = useMemo(
    () => areAllPromptVariablesFilled(variableNames, values),
    [variableNames, values],
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

  const beginSubmit = useCallback(() => {
    if (!isComplete || submittingRef.current) return false;

    submittingRef.current = true;
    setIsSubmitting(true);
    return true;
  }, [isComplete]);

  const finishSubmit = useCallback(() => {
    submittingRef.current = false;
    if (mountedRef.current) {
      setIsSubmitting(false);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (!beginSubmit()) return;

    Promise.resolve()
      .then(() => onCopy(renderedText))
      .then(() => {
        if (!mountedRef.current) return;
        setCopied(true);
        // The copied affordance is visual only; avoid state updates if the modal
        // closes before the timeout completes.
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
      })
      .finally(finishSubmit);
  }, [beginSubmit, finishSubmit, renderedText, onCopy]);

  const handlePrimaryAction = useCallback(() => {
    if (isPasteAction) {
      if (!beginSubmit()) return;
      Promise.resolve()
        .then(() => onPaste(renderedText))
        .catch(() => {})
        .finally(finishSubmit);
      return;
    }

    handleCopy();
  }, [beginSubmit, finishSubmit, handleCopy, isPasteAction, onPaste, renderedText]);

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
    isSubmitting,
    renderedText,
    values,
  };
}
