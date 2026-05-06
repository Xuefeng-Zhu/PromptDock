import { Lightbulb, X } from 'lucide-react';
import type { PromptVariable } from '../../types/index';

interface LivePreviewPanelProps {
  body: string;
  promptVariables: PromptVariable[];
  renderedPreview: string;
  variableValues: Record<string, string>;
  onResetPreview: () => void;
  onVariableValueChange: (name: string, value: string) => void;
}

function formatVariableLabel(variableName: string): string {
  return variableName.charAt(0).toUpperCase() + variableName.slice(1);
}

export function LivePreviewPanel({
  body,
  promptVariables,
  renderedPreview,
  variableValues,
  onResetPreview,
  onVariableValueChange,
}: LivePreviewPanelProps) {
  return (
    <aside className="w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Live Preview</h2>
        <button
          type="button"
          onClick={onResetPreview}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-xs text-[var(--color-text-muted)]">Preview with example values</p>
        {promptVariables.map((variable) => (
          <div
            key={variable.name}
            className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          >
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              {formatVariableLabel(variable.name)}
            </label>
            <div className="flex items-start justify-between gap-2">
              {variable.inputType === 'textarea' ? (
                <textarea
                  value={variableValues[variable.name] ?? variable.defaultValue}
                  onChange={(event) => onVariableValueChange(variable.name, event.target.value)}
                  placeholder={`Enter ${variable.name}…`}
                  rows={3}
                  className="min-h-16 flex-1 resize-none bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
                  aria-label={`Preview value for ${variable.name}`}
                />
              ) : variable.inputType === 'dropdown' ? (
                <select
                  value={variableValues[variable.name] ?? variable.defaultValue}
                  onChange={(event) => onVariableValueChange(variable.name, event.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none"
                  aria-label={`Preview value for ${variable.name}`}
                >
                  <option value="">Select {variable.name}…</option>
                  {variable.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={variableValues[variable.name] ?? variable.defaultValue}
                  onChange={(event) => onVariableValueChange(variable.name, event.target.value)}
                  placeholder={`Enter ${variable.name}…`}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
                  aria-label={`Preview value for ${variable.name}`}
                />
              )}
              {(variableValues[variable.name] ?? variable.defaultValue) && (
                <button
                  type="button"
                  onClick={() => onVariableValueChange(variable.name, '')}
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                  aria-label={`Clear ${variable.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {promptVariables.length === 0 && (
          <p className="text-xs text-[var(--color-text-placeholder)] italic">
            No variables detected yet
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">Preview Result</h3>
        {body ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <pre className="whitespace-pre-wrap font-[var(--font-mono)] text-xs leading-relaxed text-[var(--color-text-main)]">
              {renderedPreview}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-placeholder)] italic">
            Start typing in the body editor to see a preview…
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4 bg-amber-50">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-main)]">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Tips
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Variables make your prompt reusable. Use clear names like{' '}
          <span className="text-[var(--color-primary)]">audience</span>,{' '}
          <span className="text-[var(--color-primary)]">format</span>, or{' '}
          <span className="text-[var(--color-primary)]">text</span>{' '}
          for best results.
        </p>
      </div>
    </aside>
  );
}
