import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ListFilter, Search, X } from 'lucide-react';
import {
  countActivePromptFilters,
  createDefaultPromptFilters,
  normalizePromptFilters,
  type FilterType,
  type FolderFilter,
  type LastUsedFilter,
  type PromptFilters,
  type StatusFilter,
  type TagFilter,
} from '../utils/prompt-filters';
import { Button } from './ui/Button';

interface PromptFiltersPopoverProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Favorites only', value: 'favorites' },
  { label: 'Recent', value: 'recent' },
  { label: 'Archived', value: 'archived' },
  { label: 'Has variables', value: 'hasVariables' },
  { label: 'Shared prompts', value: 'shared' },
];

const FOLDER_OPTIONS: Array<FilterOption<FolderFilter>> = [
  { label: 'Work', value: 'work' },
  { label: 'Writing', value: 'writing' },
  { label: 'Product', value: 'product' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Personal', value: 'personal' },
];

const TAG_OPTIONS: Array<FilterOption<TagFilter>> = [
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

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option.label])) as Record<StatusFilter, string>;
const FOLDER_LABELS = Object.fromEntries(FOLDER_OPTIONS.map((option) => [option.value, option.label])) as Record<FolderFilter, string>;
const TAG_LABELS = Object.fromEntries(TAG_OPTIONS.map((option) => [option.value, option.label])) as Record<TagFilter, string>;
const LAST_USED_LABELS = Object.fromEntries(LAST_USED_OPTIONS.map((option) => [option.value, option.label])) as Record<LastUsedFilter, string>;

type ActiveFilterChip =
  | { id: string; label: string; kind: 'query' }
  | { id: string; label: string; kind: 'status'; value: StatusFilter }
  | { id: string; label: string; kind: 'folder'; value: FolderFilter }
  | { id: string; label: string; kind: 'tag'; value: TagFilter }
  | { id: string; label: string; kind: 'lastUsed' };

function toggleFilterValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getActiveFilterChips(filters: PromptFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.query.trim() !== '') {
    chips.push({
      id: 'query',
      label: `Search: ${filters.query.trim()}`,
      kind: 'query',
    });
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
      if (chip.kind === 'query') {
        return { ...current, query: '' };
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

          <div className="grid max-h-[27rem] grid-cols-1 overflow-y-auto md:grid-cols-[0.9fr_1.35fr_1fr]">
            <div className="space-y-6 border-b border-[var(--color-border)] p-5 md:border-b-0 md:border-r">
              <FilterSection title="Search">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 focus-within:border-[var(--color-primary)]">
                  <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={draftFilters.query}
                    onChange={(event) => updateDraftFilters({ query: event.target.value })}
                    placeholder="Title or keywords"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                    aria-label="Search title or keywords"
                  />
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
                <SearchableMultiSelect
                  label="tags"
                  options={TAG_OPTIONS}
                  selectedValues={draftFilters.tags}
                  onChange={(tags) => updateDraftFilters({ tags })}
                  placeholder="Select tags"
                  searchPlaceholder="Search tags..."
                  emptyMessage="No tags found"
                  formatSelected={(option) => `#${option.label.toLowerCase()}`}
                />
              </FilterSection>
            </div>

            <div className="p-5">
              <FilterSection title="Folders">
                <SearchableMultiSelect
                  label="folders"
                  options={FOLDER_OPTIONS}
                  selectedValues={draftFilters.folders}
                  onChange={(folders) => updateDraftFilters({ folders })}
                  placeholder="Select folders"
                  searchPlaceholder="Search folders..."
                  emptyMessage="No folders found"
                />
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

interface SearchableMultiSelectProps<T extends string> {
  label: string;
  options: Array<FilterOption<T>>;
  selectedValues: T[];
  onChange: (values: T[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  formatSelected?: (option: FilterOption<T>) => string;
}

function SearchableMultiSelect<T extends string>({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  formatSelected,
}: SearchableMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const summary = selectedOptions.length > 0
    ? selectedOptions.map((option) => formatSelected?.(option) ?? option.label).join(', ')
    : placeholder;

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

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

  function toggleValue(value: T) {
    onChange(toggleFilterValue(selectedValues, value));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
          selectedOptions.length > 0
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-placeholder)]"
              aria-label={`Search ${label}`}
            />
          </div>

          <div className="max-h-44 overflow-y-auto" role="listbox" aria-label={label}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = selectedSet.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleValue(option.value)}
                    className={[
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-main)] hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        selected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-panel)]',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 truncate">
                      {formatSelected?.(option) ?? option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-2 py-3 text-sm text-[var(--color-text-muted)]">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
