import { ListFilter } from 'lucide-react';

interface FilterPopoverTriggerProps {
  activeFilterCount: number;
  open: boolean;
  onClick: () => void;
}

export function FilterPopoverTrigger({
  activeFilterCount,
  open,
  onClick,
}: FilterPopoverTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
        open || activeFilterCount > 0
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm'
          : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
      ].join(' ')}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <ListFilter className="h-4 w-4" />
      Filters
      {activeFilterCount > 0 && (
        <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
