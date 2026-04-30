// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Reusable switch-style toggle with label.
 * Uses a `<button>` with `role="switch"` and `aria-checked` for accessibility.
 * The toggle knob animates between left (off) and right (on) positions.
 * Styled with CSS custom properties from the design token system.
 */
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
          'disabled:pointer-events-none disabled:opacity-50',
          checked ? 'bg-[var(--color-primary)]' : 'bg-gray-300',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
      <span className="text-sm text-[var(--color-text-main)]">{label}</span>
    </label>
  );
}
