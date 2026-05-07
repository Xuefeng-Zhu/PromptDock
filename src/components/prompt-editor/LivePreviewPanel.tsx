import { Lightbulb } from 'lucide-react';
import { PreviewVariableInput } from './PreviewVariableInput';

interface LivePreviewPanelProps {
  body: string;
  renderedPreview: string;
  variableValues: Record<string, string>;
  variables: string[];
  onResetPreview: () => void;
  onVariableValueChange: (name: string, value: string) => void;
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
          <PreviewVariableInput
            key={variableName}
            variableName={variableName}
            value={variableValues[variableName] ?? ''}
            onChange={onVariableValueChange}
          />
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
