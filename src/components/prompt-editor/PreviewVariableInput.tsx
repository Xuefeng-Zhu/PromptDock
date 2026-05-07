import { useId } from 'react';
import { X } from 'lucide-react';

interface PreviewVariableInputProps {
  variableName: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

function formatVariableLabel(variableName: string): string {
  return variableName.charAt(0).toUpperCase() + variableName.slice(1);
}

export function PreviewVariableInput({ variableName, value, onChange }: PreviewVariableInputProps) {
  const inputId = useId();

  return (
    <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
      <label
        htmlFor={inputId}
        className="block text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5"
      >
        {formatVariableLabel(variableName)}
      </label>
      <div className="flex items-start justify-between gap-2">
        <input
          type="text"
          id={inputId}
          value={value}
          onChange={(event) => onChange(variableName, event.target.value)}
          placeholder={`Enter ${variableName}…`}
          className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
          aria-label={`Preview value for ${variableName}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(variableName, '')}
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            aria-label={`Clear ${variableName}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
