import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ListFilter, X } from 'lucide-react';
import {
  countActivePromptFilters,
  createDefaultPromptFilters,
  normalizePromptFilters,
  type FilterType,
  type FolderFilter,
  type LastUsedFilter,
  type PromptFilters,
  type SortFilter,
  type StatusFilter,
  type TagFilter,
} from '../utils/prompt-filters';
import { Button } from './ui/Button';

interface PromptFiltersPopoverProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const SORT_OPTIONS: Array<{ label: string; value: SortFilter }> = [
  { label: 'Last used', value: 'lastUsed' },
  { label: 'Updated', value: 'updated' },
  { label: 'Created', value: 'created' },
  { label: 'A-Z', value: 'az' },
];

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Favorites only', value: 'favorites' },
  { label: 'Recent', value: 'recent' },
  { label: 'Archived', value: 'archived' },
  { label: 'Has variables', value: 'hasVariables' },
  { label: 'Shared prompts', value: 'shared' },
];

const FOLDER_OPTIONS: Array<{ label: string; value: FolderFilter }> = [
  { label: 'Work', value: 'work' },
  { label: 'Writing', value: 'writing' },
  { label: 'Product', value: 'product' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Personal', value: 'personal' },
];

const TAG_OPTIONS: Array<{ label: string; value: TagFilter }> = [
  { label: 'Writing', value: 'writing' },
  { label: 'Summarization', value: 'summarization' },
  { label: 'Email', value: 'email' },
  { label: 'Code', value: 'code' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Ideation', value: 'ideation' },
];

const LAST_USED_OPTIONS: Array<{ label: string; value: LastUsedFilter }> = [
  { label: 'Any time', value: 'any' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'last7Days' },
  { label: 'Last 30 days', value: 'last30Days' },
];

const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map((option) => [option.value, option.label])) as Record<SortFilter, string>;
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option.label])) as Record<StatusFilter, string>;
const FOLDER_LABELS = Object.fromEntries(FOLDER_OPTIONS.map((option) => [option.value, option.label])) as Record<FolderFilter, string>;
const TAG_LABELS = Object.fromEntries(TAG_OPTIONS.map((option) => [option.value, option.label])) as Record<TagFilter, string>;
const LAST_USED_LABELS = Object.fromEntries(LAST_USED_OPTIONS.map((option) => [option.value, option.label])) as Record<LastUsedFilter, string>;

type ActiveFilterChip =
  | { id: string; label: string; kind: 'sort' }
  | { id: string; label: string; kind: 'status'; value: StatusFilter }
  | { id: string; label: string; kind: 'folder'; value: FolderFilter }
  | { id: string; label: string; kind: 'tag'; value: TagFilter }
  | { id: string; label: string; kind: 'lastUsed' };

export function getSortFilterLabel(sortBy: SortFilter): string {
  return SORT_LABELS[sortBy];
}

function toggleFilterValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getActiveFilterChips(filters: PromptFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.sortBy !== 'lastUsed') {
    chips.push({ id: 'sort', label: `Sort: ${SORT_LABELS[filters.sortBy]}`, kind: 'sort' });
  }

  for (const status of filters.statuses) {
    chips.push({
      id: `status-${status}`,
      label: `Status: ${STATUS_LABELS[status]}`,
      kind: 'status',
      value: status,
    });
  }

  for (const folder of filters.folders) {
    chips.push({
      id: `folder-${folder}`,
      label: `Folder: ${FOLDER_LABELS[folder]}`,
      kind: 'folder',
      value: folder,
    });
  }

  for (const tag of filters.tags) {
    chips.push({
      id: `tag-${tag}`,
      label: `#${TAG_LABELS[tag].toLowerCase()}`,
      kind: 'tag',
      value: tag,
    });
  }

  if (filters.lastUsed !== 'any') {
    chips.push({
      id: 'last-used',
      label: `Last used: ${LAST_USED_LABELS[filters.lastUsed]}`,
      kind: 'lastUsed',
    });
  }

  return chips;
}

export function PromptFiltersPopover({ activeFilter, onFilterChange }: PromptFiltersPopoverProps) {
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const appliedFilters = useMemo(() => normalizePromptFilters(activeFilter), [activeFilter]);
  const [draftFilters, setDraftFilters] = useState<PromptFilters>(() => appliedFilters);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = countActivePromptFilters(appliedFilters);
  const draftFilterChips = useMemo(() => getActiveFilterChips(draftFilters), [draftFilters]);

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
    setDraftFilters((current) => {
      if (chip.kind === 'sort') {
        return { ...current, sortBy: 'lastUsed' };
      }

      if (chip.kind === 'lastUsed') {
        return { ...current, lastUsed: 'any' };
      }

      if (chip.kind === 'status') {
        return {
          ...current,
          statuses: current.statuses.filter((status) => status !== chip.value),
        };
      }

      if (chip.kind === 'folder') {
        return {
          ...current,
          folders: current.folders.filter((folder) => folder !== chip.value),
        };
      }

      return {
        ...current,
        tags: current.tags.filter((tag) => tag !== chip.value),
      };
    });
  }

  function applyDraftFilters() {
    onFilterChange(draftFilters);
    setFilterPopoverOpen(false);
  }

  return (
    <div className="relative" ref={filterPopoverRef}>
      <button
        type="button"
        onClick={handleFilterButtonClick}
        className={[
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
          filterPopoverOpen || activeFilterCount > 0
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm'
            : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
        ].join(' ')}
        aria-haspopup="dialog"
        aria-expanded={filterPopoverOpen}
      >
        <ListFilter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {filterPopoverOpen && (
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
                onClick={resetDraftFilters}
                className="rounded-md px-2 py-1 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-50 hover:text-[var(--color-text-main)]"
              >
                Clear all
              </button>
            </div>

            <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2">
              {draftFilterChips.length > 0 ? (
                draftFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => removeFilterChip(chip)}
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
          </div>

          <div className="grid max-h-[27rem] grid-cols-1 overflow-y-auto md:grid-cols-[1fr_1.35fr_1fr]">
            <div className="space-y-6 border-b border-[var(--color-border)] p-5 md:border-b-0 md:border-r">
              <FilterSection title="Sort by">
                <div className="space-y-1">
                  {SORT_OPTIONS.map((option) => (
                    <ChoiceRow
                      key={option.value}
                      label={option.label}
                      selected={draftFilters.sortBy === option.value}
                      type="radio"
                      onClick={() => updateDraftFilters({ sortBy: option.value })}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Last used">
                <div className="grid grid-cols-2 gap-2">
                  {LAST_USED_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateDraftFilters({ lastUsed: option.value })}
                      className={[
                        'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                        draftFilters.lastUsed === option.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>

            <div className="space-y-6 border-b border-[var(--color-border)] p-5 md:border-b-0 md:border-r">
              <FilterSection title="Status">
                <div className="space-y-1">
                  {STATUS_OPTIONS.map((option) => (
                    <ChoiceRow
                      key={option.value}
                      label={option.label}
                      selected={draftFilters.statuses.includes(option.value)}
                      type="checkbox"
                      onClick={() =>
                        updateDraftFilters({
                          statuses: toggleFilterValue(draftFilters.statuses, option.value),
                        })
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Tags">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((option) => (
                    <TagChoice
                      key={option.value}
                      label={`#${option.label.toLowerCase()}`}
                      selected={draftFilters.tags.includes(option.value)}
                      onClick={() =>
                        updateDraftFilters({
                          tags: toggleFilterValue(draftFilters.tags, option.value),
                        })
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            </div>

            <div className="p-5">
              <FilterSection title="Folders">
                <div className="space-y-1">
                  {FOLDER_OPTIONS.map((option) => (
                    <ChoiceRow
                      key={option.value}
                      label={option.label}
                      selected={draftFilters.folders.includes(option.value)}
                      type="checkbox"
                      onClick={() =>
                        updateDraftFilters({
                          folders: toggleFilterValue(draftFilters.folders, option.value),
                        })
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] p-5">
            <Button type="button" variant="secondary" size="md" onClick={resetDraftFilters}>
              Reset
            </Button>
            <Button type="button" variant="primary" size="md" onClick={applyDraftFilters}>
              Apply filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">{title}</h3>
      {children}
    </section>
  );
}

interface ChoiceRowProps {
  label: string;
  selected: boolean;
  type: 'radio' | 'checkbox';
  onClick: () => void;
}

function ChoiceRow({ label, selected, type, onClick }: ChoiceRowProps) {
  return (
    <button
      type="button"
      role={type === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
        selected
          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center border',
          type === 'radio' ? 'rounded-full' : 'rounded',
          selected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
            : 'border-[var(--color-border)] bg-[var(--color-panel)]',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && (
          type === 'radio'
            ? <span className="h-1.5 w-1.5 rounded-full bg-white" />
            : <Check className="h-3 w-3" />
        )}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

interface TagChoiceProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function TagChoice({ label, selected, onClick }: TagChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
