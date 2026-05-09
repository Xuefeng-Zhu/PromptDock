import type { ChangeEvent } from 'react';
import { X } from 'lucide-react';
import type { PromptVariable } from '../../types/index';

interface PromptVariableValueControlProps {
  variable: PromptVariable;
  value: string;
  onValueChange: (name: string, value: string) => void;
}

type PreviewInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function formatVariableLabel(variableName: string): string {
  return variableName.charAt(0).toUpperCase() + variableName.slice(1);
}

export function PromptVariableValueControl({
  variable,
  value,
  onValueChange,
}: PromptVariableValueControlProps) {
  const handleChange = (event: ChangeEvent<PreviewInputElement>) => {
    onValueChange(variable.name, event.target.value);
  };

  return (
    <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
      <label className="block text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
        {formatVariableLabel(variable.name)}
      </label>
      <div className="flex items-start justify-between gap-2">
        {variable.inputType === 'textarea' ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${variable.name}…`}
            rows={3}
            className="min-h-16 flex-1 resize-none bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
            aria-label={`Preview value for ${variable.name}`}
          />
        ) : variable.inputType === 'dropdown' ? (
          <select
            value={value}
            onChange={handleChange}
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
            value={value}
            onChange={handleChange}
            placeholder={`Enter ${variable.name}…`}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
            aria-label={`Preview value for ${variable.name}`}
          />
        )}
        {value && (
          <button
            type="button"
            onClick={() => onValueChange(variable.name, '')}
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            aria-label={`Clear ${variable.name}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
