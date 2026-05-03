import { LAST_USED_OPTIONS } from '../../utils/prompt-filter-chips';
import type { PromptFilters } from '../../utils/prompt-filters';
import { FilterSection } from './FilterSection';

interface LastUsedFilterGroupProps {
  value: PromptFilters['lastUsed'];
  onChange: (lastUsed: PromptFilters['lastUsed']) => void;
}

export function LastUsedFilterGroup({ value, onChange }: LastUsedFilterGroupProps) {
  return (
    <FilterSection title="Last used">
      <div className="grid grid-cols-1 gap-2">
        {LAST_USED_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              value === option.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-gray-50',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </FilterSection>
  );
}
