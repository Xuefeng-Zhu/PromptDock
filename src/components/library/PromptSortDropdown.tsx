import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  normalizePromptFilters,
  type FilterType,
  type PromptFilters,
  type SortFilter,
} from '../../utils/prompt-filters';

interface PromptSortDropdownProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const SORT_OPTIONS: Array<{ label: string; value: SortFilter }> = [
  { label: 'Last used', value: 'lastUsed' },
  { label: 'Updated', value: 'updated' },
  { label: 'Created', value: 'created' },
  { label: 'A-Z', value: 'az' },
];

const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map((option) => [option.value, option.label])) as Record<SortFilter, string>;

export function getSortFilterLabel(sortBy: SortFilter): string {
  return SORT_LABELS[sortBy];
}

export function PromptSortDropdown({ activeFilter, onFilterChange }: PromptSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const appliedFilters = useMemo(() => normalizePromptFilters(activeFilter), [activeFilter]);

  useEffect(() => {
    if (!open) return;

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

  function handleSortChange(sortBy: SortFilter) {
    const nextFilters: PromptFilters = {
      ...appliedFilters,
      sortBy,
    };
    onFilterChange(nextFilters);
    setOpen(false);
  }

  return (
    <div className="relative text-xs text-[var(--color-text-muted)]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:bg-gray-50 hover:text-[var(--color-text-main)] sm:min-h-0 sm:py-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Sorted by {getSortFilterLabel(appliedFilters.sortBy)}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={appliedFilters.sortBy === option.value}
              onClick={() => handleSortChange(option.value)}
              className={[
                'flex w-full items-center px-3 py-2 text-left text-xs transition-colors',
                appliedFilters.sortBy === option.value
                  ? 'font-medium text-[var(--color-primary)]'
                  : 'text-[var(--color-text-main)] hover:bg-gray-50',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
