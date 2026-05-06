import React from 'react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

// ─── Padding Styles ────────────────────────────────────────────────────────────

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7',
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable card container with white background, soft border,
 * rounded corners, and gentle shadow. Accepts a padding variant
 * and optional extra className for layout customization.
 * Styled using CSS custom properties from the design token system.
 */
export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border shadow-sm',
        'bg-[var(--color-panel)] border-[var(--color-border)]',
        paddingStyles[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
