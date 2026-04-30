import React, { useId } from 'react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable textarea primitive with optional label and error text.
 * Styled with rounded corners, focus ring, and consistent border
 * using CSS custom properties from the design token system.
 *
 * The label is associated with the textarea via htmlFor/id for accessibility.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--color-text-main)]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'bg-[var(--color-panel)] text-[var(--color-text-main)]',
            'placeholder:text-[var(--color-text-placeholder)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
            'disabled:pointer-events-none disabled:opacity-50',
            error
              ? 'border-red-500 focus-visible:outline-red-500'
              : 'border-[var(--color-border)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...rest}
        />

        {error && (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
