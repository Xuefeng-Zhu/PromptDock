import { Check, ListFilter, Search, X } from 'lucide-react';
import {
  type FilterType,
  type FolderFilter,
  type TagFilter,
} from '../utils/prompt-filters';
import {
  LAST_USED_OPTIONS,
  STATUS_OPTIONS,
  toggleFilterValue,
} from '../utils/prompt-filter-chips';
import { usePromptFilterPopover } from '../hooks/use-prompt-filter-popover';
import { Button } from './ui/Button';
import {
  SearchableMultiSelect,
  type SearchableMultiSelectOption,
} from './ui/SearchableMultiSelect';

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

          <div className="grid max-h-[27rem] grid-cols-1 overflow-y-auto md:grid-cols-3">
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
            </div>

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

              <FilterSection title="Folders">
                <SearchableMultiSelect
                  label="folders"
                  options={folderOptions}
                  selectedValues={draftFilters.folders}
                  onChange={(folders) => updateDraftFilters({ folders })}
                  placeholder="Select folders"
                  searchPlaceholder="Search folders..."
                  emptyMessage="No folders found"
                />
              </FilterSection>

              <FilterSection title="Tags">
                <SearchableMultiSelect
                  label="tags"
                  options={tagOptions}
                  selectedValues={draftFilters.tags}
                  onChange={(tags) => updateDraftFilters({ tags })}
                  placeholder="Select tags"
                  searchPlaceholder="Search tags..."
                  emptyMessage="No tags found"
                  formatSelected={(option) => `#${option.label.toLowerCase()}`}
                />
              </FilterSection>
            </div>

            <div className="space-y-6 p-5">
              <FilterSection title="Last used">
                <div className="grid grid-cols-1 gap-2">
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
