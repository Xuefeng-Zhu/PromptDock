import {
  STATUS_OPTIONS,
  toggleFilterValue,
} from '../../utils/prompt-filter-chips';
import type { PromptFilters } from '../../utils/prompt-filters';
import { ChoiceRow } from './ChoiceRow';
import { FilterSection } from './FilterSection';

interface StatusFilterGroupProps {
  statuses: PromptFilters['statuses'];
  onChange: (statuses: PromptFilters['statuses']) => void;
}

export function StatusFilterGroup({ statuses, onChange }: StatusFilterGroupProps) {
  return (
    <FilterSection title="Status">
      <div className="space-y-1">
        {STATUS_OPTIONS.map((option) => (
          <ChoiceRow
            key={option.value}
            label={option.label}
            selected={statuses.includes(option.value)}
            type="checkbox"
            onClick={() => onChange(toggleFilterValue(statuses, option.value))}
          />
        ))}
      </div>
    </FilterSection>
  );
}
