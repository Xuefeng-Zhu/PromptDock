import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, ClipboardPaste, Copy, X } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import type { PromptRecipe, UserSettings } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface VariableFillModalProps {
  prompt: PromptRecipe;
  variables: string[];
  onCancel: () => void;
  defaultAction?: UserSettings['defaultAction'];
  onCopy: (renderedText: string) => void | Promise<void>;
  onPaste: (renderedText: string) => void | Promise<void>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders a prompt body by replacing all {{variable_name}} placeholders
 * with the corresponding values from the values map.
 * Returns the body with unfilled variables left as-is.
 */
function renderBody(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    return values[name] || `{{${name}}}`;
  });
}

/**
 * Checks whether all variables have been filled with non-empty values.
 */
function allVariablesFilled(
  variables: string[],
  values: Record<string, string>,
): boolean {
  return variables.every((v) => (values[v] ?? '').trim().length > 0);
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Redesigned Variable Fill Modal — displays input fields for each detected
 * variable in a prompt template, shows a live rendered preview, and provides
 * Cancel and primary action buttons with keyboard shortcut hints.
 *
 * Uses a <dialog> element with role="dialog" and aria-modal="true".
 * Auto-focuses the first variable input on open.
 * Closes on Escape key or backdrop click.
 */
export function VariableFillModal({
  prompt,
  variables,
  onCancel,
  defaultAction = 'paste',
  onCopy,
  onPaste,
}: VariableFillModalProps) {
  // ── Variable values state ──────────────────────────────────────────────────
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of variables) {
      initial[v] = '';
    }
    return initial;
  });

  // ── "Copied!" success state ────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mountedRef = useRef(true);

  // ── Computed values ────────────────────────────────────────────────────────
  const isComplete = useMemo(
    () => allVariablesFilled(variables, values),
    [variables, values],
  );

  const renderedText = useMemo(
    () => renderBody(prompt.body, values),
    [prompt.body, values],
  );

  const isPasteAction = defaultAction === 'paste';

  // ── Auto-focus first input on mount ────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
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

  // ── Keyboard handler (Escape to close, ⌘↵ for primary action) ────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘↵ / Ctrl+Enter → Primary action
      if (isMeta && e.key === 'Enter' && isComplete) {
        e.preventDefault();
        handlePrimaryAction();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrimaryAction, isComplete, onCancel]);

  // ── Backdrop click handler ─────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] animate-[fadeIn_150ms_ease-out]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleBackdropClick}
      data-testid="variable-fill-backdrop"
    >
      <dialog
        ref={dialogRef}
        open
        role="dialog"
        aria-modal="true"
        aria-label={`Fill variables for ${prompt.title}`}
        className="relative m-0 flex w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl animate-[slideDown_150ms_ease-out]"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-main)' }}>
              {prompt.title}
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Fill in the variables below to complete your prompt
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close variable fill modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ maxHeight: '60vh' }}>
          {/* Variable inputs */}
          {variables.length > 0 && (
            <fieldset>
              <legend className="sr-only">Template Variables</legend>
              <div className="space-y-3">
                {variables.map((varName, index) => (
                  <Input
                    key={varName}
                    ref={index === 0 ? firstInputRef : undefined}
                    label={varName}
                    value={values[varName] ?? ''}
                    onChange={(e) => handleValueChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}`}
                    aria-label={`Value for variable ${varName}`}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {/* Live preview */}
          <div className="mt-5">
            <h3
              className="mb-2 text-sm font-medium"
              style={{ color: 'var(--color-text-main)' }}
            >
              Preview
            </h3>
            <Card padding="sm" className="max-h-48 overflow-y-auto">
              <pre
                className="whitespace-pre-wrap text-sm"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isComplete
                    ? 'var(--color-text-main)'
                    : 'var(--color-text-muted)',
                }}
                aria-live="polite"
                aria-label="Rendered prompt preview"
              >
                {renderedText}
              </pre>
            </Card>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center justify-end border-t px-5 py-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            {/* Cancel */}
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Cancel
              <kbd
                className="ml-1.5 rounded border px-1 py-0.5 text-[10px] font-mono"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                }}
              >
                Esc
              </kbd>
            </Button>

            {/* Primary action */}
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrimaryAction}
              disabled={!isComplete}
              className={!isPasteAction && copied ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {!isPasteAction && copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  {isPasteAction ? (
                    <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isPasteAction ? 'Paste into active app' : 'Copy final prompt'}
                  <kbd
                    className="ml-1.5 rounded border px-1 py-0.5 text-[10px] font-mono"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    ⌘↵
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
