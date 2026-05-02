import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableMultiSelectOption<T extends string> {
  label: string;
  value: T;
}

interface SearchableMultiSelectProps<T extends string> {
  label: string;
  options: Array<SearchableMultiSelectOption<T>>;
  selectedValues: T[];
  onChange: (values: T[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  formatSelected?: (option: SearchableMultiSelectOption<T>) => string;
}

type DropdownPlacement = 'top' | 'bottom';

interface DropdownPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

const DROPDOWN_GAP = 8;
const DROPDOWN_MAX_HEIGHT = 240;
const DROPDOWN_MIN_HEIGHT = 144;
const VIEWPORT_PADDING = 12;
const DEFAULT_DROPDOWN_POSITION: DropdownPosition = {
  left: 0,
  top: 0,
  width: 0,
  maxHeight: DROPDOWN_MAX_HEIGHT,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function SearchableMultiSelect<T extends string>({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  formatSelected,
}: SearchableMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<DropdownPlacement>('bottom');
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>(
    DEFAULT_DROPDOWN_POSITION,
  );
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const summary = selectedOptions.length > 0
    ? selectedOptions.map((option) => formatSelected?.(option) ?? option.label).join(', ')
    : placeholder;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePlacement() {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const availableBelow = window.innerHeight
        - buttonRect.bottom
        - VIEWPORT_PADDING
        - DROPDOWN_GAP;
      const availableAbove = buttonRect.top - VIEWPORT_PADDING - DROPDOWN_GAP;
      const nextPlacement = availableBelow < DROPDOWN_MAX_HEIGHT && availableAbove > availableBelow
        ? 'top'
        : 'bottom';
      const availableHeight = nextPlacement === 'top' ? availableAbove : availableBelow;
      const maxHeight = clamp(availableHeight, DROPDOWN_MIN_HEIGHT, DROPDOWN_MAX_HEIGHT);
      const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING - buttonRect.width);
      const left = clamp(buttonRect.left, VIEWPORT_PADDING, maxLeft);
      const top = nextPlacement === 'top'
        ? Math.max(VIEWPORT_PADDING, buttonRect.top - DROPDOWN_GAP - maxHeight)
        : Math.min(
          buttonRect.bottom + DROPDOWN_GAP,
          window.innerHeight - VIEWPORT_PADDING - maxHeight,
        );

      setPlacement(nextPlacement);
      setDropdownPosition({
        left,
        top,
        width: buttonRect.width,
        maxHeight,
      });
    }

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
          selectedOptions.length > 0
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div
          className={[
            'fixed z-[80] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-xl',
            placement === 'top' ? 'origin-bottom' : 'origin-top',
          ].join(' ')}
          style={dropdownPosition}
        >
          <div className="mb-2 flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-placeholder)]"
              aria-label={`Search ${label}`}
            />
          </div>

          <div
            className="overflow-y-auto"
            role="listbox"
            aria-label={label}
            style={{ maxHeight: Math.max(88, dropdownPosition.maxHeight - 58) }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = selectedSet.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onChange(toggleValue(selectedValues, option.value))}
                    className={[
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-main)] hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        selected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-panel)]',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 truncate">
                      {formatSelected?.(option) ?? option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-2 py-3 text-sm text-[var(--color-text-muted)]">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
