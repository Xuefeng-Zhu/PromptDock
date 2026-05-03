import { Code } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface VariableListProps {
  variables: string[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Displays a list of detected `{{variable_name}}` placeholders extracted
 * from a prompt body. Each variable is shown in a monospace font with
 * the double-brace syntax for clarity.
 */
export function VariableList({ variables }: VariableListProps) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
        <Code className="h-3.5 w-3.5" />
        Variables
      </h4>
      <ul className="space-y-1">
        {variables.map((variable) => (
          <li
            key={variable}
            className="inline-flex items-center rounded-md bg-[var(--color-primary-light)] px-2 py-1 mr-2 text-xs font-mono text-[var(--color-primary)]"
          >
            {`{{${variable}}}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
