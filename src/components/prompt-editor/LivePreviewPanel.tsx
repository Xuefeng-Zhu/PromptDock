import { Lightbulb } from 'lucide-react';
import type { PromptVariable } from '../../types/index';
import { LivePreviewVariableControl } from './LivePreviewVariableControl';

interface LivePreviewPanelProps {
  body: string;
  promptVariables: PromptVariable[];
  renderedPreview: string;
  variableValues: Record<string, string>;
  onResetPreview: () => void;
  onVariableValueChange: (name: string, value: string) => void;
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
    <aside
      aria-labelledby="live-preview-heading"
      className="h-full min-h-0 w-80 shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h2 id="live-preview-heading" className="text-sm font-semibold text-[var(--color-text-main)]">
          Live Preview
        </h2>
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
          <LivePreviewVariableControl
            key={variable.name}
            variable={variable}
            value={variableValues[variable.name] ?? variable.defaultValue}
            onValueChange={onVariableValueChange}
          />
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
