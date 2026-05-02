import { Lightbulb, X } from 'lucide-react';

interface LivePreviewPanelProps {
  body: string;
  renderedPreview: string;
  variableValues: Record<string, string>;
  variables: string[];
  onResetPreview: () => void;
  onVariableValueChange: (name: string, value: string) => void;
}

function formatVariableLabel(variableName: string): string {
  return variableName.charAt(0).toUpperCase() + variableName.slice(1);
}

export function LivePreviewPanel({
  body,
  renderedPreview,
  variableValues,
  variables,
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
        {variables.map((variableName) => (
          <div
            key={variableName}
            className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          >
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
              {formatVariableLabel(variableName)}
            </label>
            <div className="flex items-start justify-between gap-2">
              <input
                type="text"
                value={variableValues[variableName] ?? ''}
                onChange={(event) => onVariableValueChange(variableName, event.target.value)}
                placeholder={`Enter ${variableName}…`}
                className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
                aria-label={`Preview value for ${variableName}`}
              />
              {variableValues[variableName] && (
                <button
                  type="button"
                  onClick={() => onVariableValueChange(variableName, '')}
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                  aria-label={`Clear ${variableName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {variables.length === 0 && (
          <p className="text-xs text-[var(--color-text-placeholder)] italic">
            No variables detected yet
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">Preview Result</h3>
        {body ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 max-h-64 overflow-y-auto">
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
