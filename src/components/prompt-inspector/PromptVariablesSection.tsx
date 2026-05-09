import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { PromptVariable } from '../../types/index';
import { PromptVariableValueControl } from '../prompt-variables/PromptVariableValueControl';

interface PromptVariablesSectionProps {
  onVariableValueChange: (name: string, value: string) => void;
  values: Record<string, string>;
  variables: PromptVariable[];
}

export function PromptVariablesSection({
  onVariableValueChange,
  values,
  variables,
}: PromptVariablesSectionProps) {
  const [expanded, setExpanded] = useState(true);

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
            <PromptVariableValueControl
              key={variable.name}
              variable={variable}
              value={values[variable.name] ?? variable.defaultValue}
              onValueChange={onVariableValueChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
