import React from 'react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// ─── Variant Styles ────────────────────────────────────────────────────────────

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text-main)] hover:bg-gray-50 active:bg-gray-100',
  ghost:
    'bg-transparent text-[var(--color-text-main)] hover:bg-gray-100 active:bg-gray-200',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

// ─── Size Styles ───────────────────────────────────────────────────────────────

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable button primitive with variant and size support.
 * Styled with rounded corners, focus ring, and variant-specific colors
 * using CSS custom properties from the design token system.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
