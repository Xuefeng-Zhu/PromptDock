import { countChars } from '../../utils/text-counts';

interface CountedInputFieldProps {
  id: string;
  label: string;
  maxLength: number;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function CountedInputField({
  id,
  label,
  maxLength,
  placeholder,
  value,
  onChange,
}: CountedInputFieldProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
          {countChars(value)}/{maxLength}
        </span>
      </div>
    </div>
  );
}

interface CountedTextareaFieldProps {
  id: string;
  label: string;
  maxLength: number;
  placeholder: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}

export function CountedTextareaField({
  id,
  label,
  maxLength,
  placeholder,
  rows,
  value,
  onChange,
}: CountedTextareaFieldProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
      >
        {label}
      </label>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors resize-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <span className="absolute right-4 bottom-3 text-xs text-[var(--color-text-muted)]">
          {countChars(value)}/{maxLength}
        </span>
      </div>
    </div>
  );
}
