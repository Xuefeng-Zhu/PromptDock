import React, { useCallback, useId, useRef, useState } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { useDismissablePopover } from './listbox/use-dismissable-popover';
import { useListboxNavigation } from './listbox/use-listbox-navigation';

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
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);
    const selectedIndex = options.findIndex((o) => o.value === value);
    const displayLabel = selectedOption?.label ?? placeholder ?? 'Select…';
    const hasValue = selectedOption !== undefined && selectedOption.value !== '';

    const handleSelect = useCallback(
      (optionValue: string) => {
        onChange?.({ target: { value: optionValue } });
        setIsOpen(false);
      },
      [onChange],
    );

    useDismissablePopover({
      containerRef,
      onDismiss: () => setIsOpen(false),
      open: isOpen,
    });

    const {
      handleKeyDown,
      highlightedIndex,
      listRef,
      setHighlightedIndex,
      toggleListbox,
    } = useListboxNavigation({
      onSelect: (index) => {
        if (options[index]) {
          handleSelect(options[index].value);
        }
      },
      open: isOpen,
      optionCount: options.length,
      selectedIndex,
      setOpen: setIsOpen,
    });

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            id={`${selectId}-label`}
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
            onClick={toggleListbox}
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
              aria-labelledby={label ? `${selectId}-label` : undefined}
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
