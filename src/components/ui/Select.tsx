import React, { useId, useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  /** Icon to show before the selected value. Defaults to FolderOpen. */
  icon?: React.ReactNode;
  onChange?: (e: { target: { value: string } }) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Custom select dropdown with a styled trigger button and popover list.
 * Replaces the native <select> for a consistent look across platforms.
 *
 * Keyboard accessible: Enter/Space to open, arrow keys to navigate,
 * Enter to select, Escape to close.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, icon, className = '', id, value, onChange, disabled, ...rest }, _ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((o) => o.value === value);
    const displayLabel = selectedOption?.label ?? placeholder ?? 'Select…';
    const hasValue = selectedOption !== undefined && selectedOption.value !== '';

    // ── Close on outside click ───────────────────────────────────────────────
    useEffect(() => {
      if (!isOpen) return;
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // ── Scroll highlighted item into view ────────────────────────────────────
    useEffect(() => {
      if (!isOpen || !listRef.current || highlightedIndex < 0) return;
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }, [isOpen, highlightedIndex]);

    const handleSelect = useCallback(
      (optionValue: string) => {
        onChange?.({ target: { value: optionValue } });
        setIsOpen(false);
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!isOpen) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex(options.findIndex((o) => o.value === value));
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (highlightedIndex >= 0 && options[highlightedIndex]) {
              handleSelect(options[highlightedIndex].value);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            break;
        }
      },
      [isOpen, highlightedIndex, options, value, handleSelect],
    );

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-main)]"
          >
            {label}
          </label>
        )}

        {/* Hidden native select for form compatibility */}
        <select
          id={selectId}
          value={value as string}
          onChange={(e) => onChange?.({ target: { value: e.target.value } })}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom trigger button */}
        <div className="relative">
          <button
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-listbox`}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            className={[
              'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
              'bg-[var(--color-panel)]',
              'disabled:pointer-events-none disabled:opacity-50',
              isOpen
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                : 'border-[var(--color-border)] hover:border-gray-300',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="shrink-0 text-[var(--color-text-muted)]">
              {icon ?? <FolderOpen className="h-4 w-4" />}
            </span>
            <span
              className={[
                'flex-1 text-left truncate',
                hasValue ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-placeholder)]',
              ].join(' ')}
            >
              {displayLabel}
            </span>
            <ChevronDown
              className={[
                'h-4 w-4 shrink-0 transition-transform text-[var(--color-text-muted)]',
                isOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {/* Dropdown list */}
          {isOpen && (
            <ul
              ref={listRef}
              id={`${selectId}-listbox`}
              role="listbox"
              className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
            >
              {options.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors',
                      isHighlighted
                        ? 'bg-[var(--color-primary-light)]'
                        : 'hover:bg-gray-50',
                      isSelected
                        ? 'font-medium text-[var(--color-primary)]'
                        : 'text-[var(--color-text-main)]',
                    ].join(' ')}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    {opt.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  },
);

Select.displayName = 'Select';
