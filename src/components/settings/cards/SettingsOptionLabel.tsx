import type { LabelHTMLAttributes } from 'react';

interface SettingsOptionLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  active: boolean;
}

export function SettingsOptionLabel({
  active,
  children,
  className = '',
  ...props
}: SettingsOptionLabelProps) {
  return (
    <label
      className={[
        'flex cursor-pointer rounded-lg border transition-colors',
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)]',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
          : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-gray-50',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </label>
  );
}
