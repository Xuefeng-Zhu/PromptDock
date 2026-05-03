import {
  SearchableMultiSelect,
  type SearchableMultiSelectOption,
} from '../ui/SearchableMultiSelect';
import type {
  FolderFilter,
  PromptFilters,
  TagFilter,
} from '../../utils/prompt-filters';
import { FilterSection } from './FilterSection';
import { SearchFilterField } from './SearchFilterField';

interface FolderTagFilterGroupsProps {
  draftFilters: PromptFilters;
  folderOptions: Array<SearchableMultiSelectOption<FolderFilter>>;
  tagOptions: Array<SearchableMultiSelectOption<TagFilter>>;
  onChange: (nextFilters: Partial<PromptFilters>) => void;
}

export function FolderTagFilterGroups({
  draftFilters,
  folderOptions,
  tagOptions,
  onChange,
}: FolderTagFilterGroupsProps) {
  return (
    <>
      <FilterSection title="Search">
        <SearchFilterField
          query={draftFilters.query}
          onChange={(query) => onChange({ query })}
        />
      </FilterSection>

      <FilterSection title="Folders">
        <SearchableMultiSelect
          label="folders"
          options={folderOptions}
          selectedValues={draftFilters.folders}
          onChange={(folders) => onChange({ folders })}
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
          onChange={(tags) => onChange({ tags })}
          placeholder="Select tags"
          searchPlaceholder="Search tags..."
          emptyMessage="No tags found"
          formatSelected={(option) => `#${option.label.toLowerCase()}`}
        />
      </FilterSection>
    </>
  );
}
