import { useEffect, useMemo, useRef, useState } from 'react';
import {
  countActivePromptFilters,
  createDefaultPromptFilters,
  normalizePromptFilters,
  type FilterType,
  type FolderFilter,
  type PromptFilters,
  type TagFilter,
} from '../utils/prompt-filters';
import {
  getActiveFilterChips,
  removeFilterChipFromFilters,
  type ActiveFilterChip,
} from '../utils/prompt-filter-chips';
import type { SearchableMultiSelectOption } from '../components/ui/SearchableMultiSelect';

interface UsePromptFilterPopoverOptions {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  folderOptions: Array<SearchableMultiSelectOption<FolderFilter>>;
  tagOptions: Array<SearchableMultiSelectOption<TagFilter>>;
}

export function usePromptFilterPopover({
  activeFilter,
  onFilterChange,
  folderOptions,
  tagOptions,
}: UsePromptFilterPopoverOptions) {
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const appliedFilters = useMemo(() => normalizePromptFilters(activeFilter), [activeFilter]);
  const [draftFilters, setDraftFilters] = useState<PromptFilters>(() => appliedFilters);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = countActivePromptFilters(appliedFilters);
  const folderLabels = useMemo(
    () => Object.fromEntries(folderOptions.map((option) => [option.value, option.label])),
    [folderOptions],
  );
  const tagLabels = useMemo(
    () => Object.fromEntries(tagOptions.map((option) => [option.value, option.label])),
    [tagOptions],
  );
  const draftFilterChips = useMemo(
    () => getActiveFilterChips(draftFilters, folderLabels, tagLabels),
    [draftFilters, folderLabels, tagLabels],
  );

  useEffect(() => {
    if (!filterPopoverOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [appliedFilters, filterPopoverOpen]);

  useEffect(() => {
    if (!filterPopoverOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setFilterPopoverOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setFilterPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterPopoverOpen]);

  function handleFilterButtonClick() {
    setDraftFilters(appliedFilters);
    setFilterPopoverOpen((open) => !open);
  }

  function updateDraftFilters(nextFilters: Partial<PromptFilters>) {
    setDraftFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  }

  function resetDraftFilters() {
    setDraftFilters(createDefaultPromptFilters());
  }

  function removeFilterChip(chip: ActiveFilterChip) {
    setDraftFilters((current) => removeFilterChipFromFilters(current, chip));
  }

  function applyDraftFilters() {
    onFilterChange(draftFilters);
    setFilterPopoverOpen(false);
  }

  return {
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
  };
}
