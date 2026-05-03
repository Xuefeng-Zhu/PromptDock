import { X } from 'lucide-react';
import type { ActiveFilterChip } from '../../utils/prompt-filter-chips';

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onRemoveChip: (chip: ActiveFilterChip) => void;
}

export function ActiveFilterChips({ chips, onRemoveChip }: ActiveFilterChipsProps) {
  return (
    <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2">
      {chips.length > 0 ? (
        chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onRemoveChip(chip)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-light)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-blue-100"
            aria-label={`Remove ${chip.label}`}
          >
            {chip.label}
            <X className="h-3.5 w-3.5" />
          </button>
        ))
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]">
          No active filters
        </span>
      )}
    </div>
  );
}
