import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { VariableParser } from '../services/variable-parser';
import { PromptRenderer } from '../services/prompt-renderer';
import type { RenderResult } from '../types/index';

// ─── Singleton instances ───────────────────────────────────────────────────────

const variableParser = new VariableParser();
const promptRenderer = new PromptRenderer(variableParser);

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface VariableFillModalProps {
  /** The prompt template body containing {{variable_name}} placeholders. */
  body: string;
  /** Optional prompt title for display in the modal header. */
  title?: string;
  /** Called when the user clicks "Copy". Receives the rendered text. */
  onCopy?: (text: string) => void;
  /** Called when the user clicks "Paste into Active App". Receives the rendered text. */
  onPaste?: (text: string) => void;
  /** Called when the user clicks "Copy & Close". Receives the rendered text. */
  onCopyAndClose?: (text: string) => void;
  /** Called when the user closes the modal without action. */
  onClose?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Variable Fill Modal — displays input fields for each detected variable in a
 * prompt template, shows a rendered preview, and provides Copy / Paste / Copy & Close actions.
 */
export function VariableFillModal({
  body,
  title,
  onCopy,
  onPaste,
  onCopyAndClose,
  onClose,
}: VariableFillModalProps) {
  // ── Extract variables from the template ────────────────────────────────────
  const variables = useMemo(() => variableParser.parse(body), [body]);

  // ── Variable values state ──────────────────────────────────────────────────
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of variables) {
      initial[v] = '';
    }
    return initial;
  });

  const handleValueChange = useCallback(
    (variableName: string, value: string) => {
      setValues((prev) => ({ ...prev, [variableName]: value }));
    },
    [],
  );

  // ── Render preview ─────────────────────────────────────────────────────────
  const renderResult: RenderResult = useMemo(
    () => promptRenderer.render(body, values),
    [body, values],
  );

  const isComplete = renderResult.success;
  const previewText = renderResult.success ? renderResult.text : '';

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (isComplete) onCopy?.(previewText);
  }, [isComplete, previewText, onCopy]);

  const handlePaste = useCallback(() => {
    if (isComplete) onPaste?.(previewText);
  }, [isComplete, previewText, onPaste]);

  const handleCopyAndClose = useCallback(() => {
    if (isComplete) onCopyAndClose?.(previewText);
  }, [isComplete, previewText, onCopyAndClose]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Fill variables for ${title}` : 'Fill template variables'}
    >
      <div className="mx-4 flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title ? `Fill Variables — ${title}` : 'Fill Variables'}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Variable inputs */}
          {variables.length > 0 ? (
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Template Variables
              </legend>
              <div className="space-y-3">
                {variables.map((varName) => (
                  <div key={varName}>
                    <label
                      htmlFor={`var-${varName}`}
                      className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400"
                    >
                      {varName}
                    </label>
                    <input
                      id={`var-${varName}`}
                      type="text"
                      value={values[varName] ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleValueChange(varName, e.target.value)
                      }
                      placeholder={`Enter value for ${varName}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                      aria-label={`Value for variable ${varName}`}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This template has no variables.
            </p>
          )}

          {/* Rendered preview */}
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </h3>
            <div
              className="min-h-[80px] rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              aria-live="polite"
              aria-label="Rendered prompt preview"
            >
              {isComplete ? (
                <pre className="whitespace-pre-wrap">{previewText}</pre>
              ) : (
                <p className="italic text-gray-400 dark:text-gray-500">
                  Fill in all variables to see the preview.
                  {!renderResult.success && renderResult.missingVariables.length > 0 && (
                    <span className="block mt-1">
                      Missing: {renderResult.missingVariables.join(', ')}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!isComplete}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Copy rendered prompt to clipboard"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handlePaste}
            disabled={!isComplete}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Paste rendered prompt into active application"
          >
            Paste into Active App
          </button>
          <button
            type="button"
            onClick={handleCopyAndClose}
            disabled={!isComplete}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Copy rendered prompt and close modal"
          >
            Copy &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
