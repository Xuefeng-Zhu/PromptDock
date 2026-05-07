import { Card } from '../ui/Card';

interface VariablePreviewProps {
  isComplete: boolean;
  renderedText: string;
}

export function VariablePreview({ isComplete, renderedText }: VariablePreviewProps) {
  return (
    <div className="mt-5">
      <h3
        className="mb-2 text-sm font-medium"
        style={{ color: 'var(--color-text-main)' }}
      >
        Preview
      </h3>
      <Card padding="sm" className="max-h-48 overflow-y-auto">
        <pre
          className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]"
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
  );
}
