import type { KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { TagAutocompleteInput } from '../prompt-tags/TagAutocompleteInput';
import { TagPill } from '../ui';

interface EditorTagFieldProps {
  availableTags?: string[];
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSelectTag: (tag: string) => void;
  onShowTagInputChange: (show: boolean) => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showTagInput: boolean;
  tagInput: string;
  tags: string[];
}

export function EditorTagField({
  availableTags = [],
  onAddTag,
  onRemoveTag,
  onSelectTag,
  onShowTagInputChange,
  onTagInputChange,
  onTagKeyDown,
  showTagInput,
  tagInput,
  tags,
}: EditorTagFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
        Tags
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            onRemove={() => onRemoveTag(tag)}
          />
        ))}
        {showTagInput ? (
          <TagAutocompleteInput
            availableTags={availableTags}
            className="relative w-44"
            onBlur={onAddTag}
            onSubmitTag={onSelectTag}
            onUnhandledKeyDown={onTagKeyDown}
            onValueChange={onTagInputChange}
            selectedTags={tags}
            value={tagInput}
          />
        ) : (
          <button
            type="button"
            onClick={() => onShowTagInputChange(true)}
            className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="Add tag"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
