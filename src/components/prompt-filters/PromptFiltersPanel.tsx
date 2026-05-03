import type { ActiveFilterChip } from '../../utils/prompt-filter-chips';
import type {
  FolderFilter,
  PromptFilters,
  TagFilter,
} from '../../utils/prompt-filters';
import type { SearchableMultiSelectOption } from '../ui/SearchableMultiSelect';
import { Button } from '../ui/Button';
import { ActiveFilterChips } from './ActiveFilterChips';
import { FolderTagFilterGroups } from './FolderTagFilterGroups';
import { LastUsedFilterGroup } from './LastUsedFilterGroup';
import { StatusFilterGroup } from './StatusFilterGroup';

interface PromptFiltersPanelProps {
  draftFilterChips: ActiveFilterChip[];
  draftFilters: PromptFilters;
  folderOptions: Array<SearchableMultiSelectOption<FolderFilter>>;
  tagOptions: Array<SearchableMultiSelectOption<TagFilter>>;
  onApply: () => void;
  onClearAll: () => void;
  onRemoveChip: (chip: ActiveFilterChip) => void;
  onReset: () => void;
  onUpdateDraftFilters: (nextFilters: Partial<PromptFilters>) => void;
}

export function PromptFiltersPanel({
  draftFilterChips,
  draftFilters,
  folderOptions,
  tagOptions,
  onApply,
  onClearAll,
  onRemoveChip,
  onReset,
  onUpdateDraftFilters,
}: PromptFiltersPanelProps) {
  return (
    <div
      role="dialog"
      aria-label="Filters"
      className="absolute left-0 top-full mt-3 w-[min(46rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl"
    >
      <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-[var(--color-border)] bg-[var(--color-panel)]" />

      <div className="relative border-b border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Filters</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Refine your prompt library
            </p>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md px-2 py-1 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-50 hover:text-[var(--color-text-main)]"
          >
            Clear all
          </button>
        </div>

        <ActiveFilterChips chips={draftFilterChips} onRemoveChip={onRemoveChip} />
      </div>

      <div className="grid max-h-[27rem] grid-cols-1 overflow-y-auto md:grid-cols-3">
        <div className="space-y-6 border-b border-[var(--color-border)] p-5 md:border-b-0 md:border-r">
          <StatusFilterGroup
            statuses={draftFilters.statuses}
            onChange={(statuses) => onUpdateDraftFilters({ statuses })}
          />
        </div>

        <div className="space-y-6 border-b border-[var(--color-border)] p-5 md:border-b-0 md:border-r">
          <FolderTagFilterGroups
            draftFilters={draftFilters}
            folderOptions={folderOptions}
            tagOptions={tagOptions}
            onChange={onUpdateDraftFilters}
          />
        </div>

        <div className="space-y-6 p-5">
          <LastUsedFilterGroup
            value={draftFilters.lastUsed}
            onChange={(lastUsed) => onUpdateDraftFilters({ lastUsed })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] p-5">
        <Button type="button" variant="secondary" size="md" onClick={onReset}>
          Reset
        </Button>
        <Button type="button" variant="primary" size="md" onClick={onApply}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}
