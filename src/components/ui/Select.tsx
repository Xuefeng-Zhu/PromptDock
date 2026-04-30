import React, { useId } from 'react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable select primitive with optional label and placeholder.
 * Styled with rounded corners, focus ring, and consistent border
 * using CSS custom properties from the design token system.
 *
 * The label is associated with the select via htmlFor/id for accessibility.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-main)]"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'bg-[var(--color-panel)] text-[var(--color-text-main)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
            'disabled:pointer-events-none disabled:opacity-50',
            'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
