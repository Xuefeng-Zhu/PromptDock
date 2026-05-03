import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PromptVariablesSectionProps {
  variables: string[];
}

export function PromptVariablesSection({ variables }: PromptVariablesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (variables.length === 0) return null;

  return (
    <div className="px-5 pb-4">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-[var(--color-text-main)]">
          Variables ({variables.length})
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {variables.map((variable) => (
            <div
              key={variable}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <span className="text-xs font-mono text-[var(--color-primary)]">{`{{${variable}}}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
