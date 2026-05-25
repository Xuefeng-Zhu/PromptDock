import React, { useId } from 'react';
import { fieldControlClass } from './field-control-class';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable input primitive with optional label, error, and hint text.
 * Styled with rounded corners, focus ring, and consistent border
 * using CSS custom properties from the design token system.
 *
 * The label is associated with the input via htmlFor/id for accessibility.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-main)]"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={fieldControlClass({ className, hasError: Boolean(error) })}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />

        {error && (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
