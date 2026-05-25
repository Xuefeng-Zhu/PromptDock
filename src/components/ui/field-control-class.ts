interface FieldControlClassOptions {
  className?: string;
  hasError?: boolean;
}

export function fieldControlClass({
  className = '',
  hasError = false,
}: FieldControlClassOptions = {}): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
    'bg-[var(--color-panel)] text-[var(--color-text-main)]',
    'placeholder:text-[var(--color-text-placeholder)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
    'disabled:pointer-events-none disabled:opacity-50',
    hasError
      ? 'border-red-500 focus-visible:outline-red-500'
      : 'border-[var(--color-border)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
