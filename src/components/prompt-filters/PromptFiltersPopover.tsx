import {
  type FilterType,
  type FolderFilter,
  type TagFilter,
} from '../../utils/prompt-filters';
import { usePromptFilterPopover } from '../../hooks/use-prompt-filter-popover';
import {
  type SearchableMultiSelectOption,
} from '../ui/SearchableMultiSelect';
import { FilterPopoverTrigger } from './FilterPopoverTrigger';
import { PromptFiltersPanel } from './PromptFiltersPanel';

interface PromptFiltersPopoverProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  folderOptions: Array<SearchableMultiSelectOption<FolderFilter>>;
  tagOptions: Array<SearchableMultiSelectOption<TagFilter>>;
}

export function PromptFiltersPopover({
  activeFilter,
  onFilterChange,
  folderOptions,
  tagOptions,
}: PromptFiltersPopoverProps) {
  const {
    activeFilterCount,
    applyDraftFilters,
    draftFilterChips,
    draftFilters,
    filterPopoverOpen,
    filterPopoverRef,
    handleFilterButtonClick,
    removeFilterChip,
    resetDraftFilters,
    updateDraftFilters,
  } = usePromptFilterPopover({
    activeFilter,
    folderOptions,
    onFilterChange,
    tagOptions,
  });

  return (
    <div className="relative" ref={filterPopoverRef}>
      <FilterPopoverTrigger
        activeFilterCount={activeFilterCount}
        open={filterPopoverOpen}
        onClick={handleFilterButtonClick}
      />

      {filterPopoverOpen && (
        <PromptFiltersPanel
          draftFilterChips={draftFilterChips}
          draftFilters={draftFilters}
          folderOptions={folderOptions}
          tagOptions={tagOptions}
          onApply={applyDraftFilters}
          onClearAll={resetDraftFilters}
          onRemoveChip={removeFilterChip}
          onReset={resetDraftFilters}
          onUpdateDraftFilters={updateDraftFilters}
        />
      )}
    </div>
  );
}
