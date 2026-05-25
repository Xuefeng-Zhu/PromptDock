import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDismissablePopover } from '../components/ui/listbox/use-dismissable-popover';
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

/**
 * Keeps the filter popover's draft state separate from applied library filters.
 * Drafts reset from the applied filter whenever the popover closes, and only
 * become active when the user applies them.
 */
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
  const closeFilterPopover = useCallback(() => {
    setFilterPopoverOpen(false);
  }, []);
  const draftFilterChips = useMemo(
    () => getActiveFilterChips(draftFilters, folderLabels, tagLabels),
    [draftFilters, folderLabels, tagLabels],
  );

  useEffect(() => {
    if (!filterPopoverOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [appliedFilters, filterPopoverOpen]);

  useDismissablePopover({
    containerRef: filterPopoverRef,
    onDismiss: closeFilterPopover,
    open: filterPopoverOpen,
  });

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
