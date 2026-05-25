import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';
import { TagAutocompleteInput } from '../prompt-tags/TagAutocompleteInput';
import {
  normalizeTag,
  resolveExistingTagName,
} from '../../utils/tag-options';

interface PromptTagsSectionProps {
  availableTags?: string[];
  onEdit?: (id: string) => void;
  onUpdateTags?: (id: string, updateTags: (tags: string[]) => string[]) => void;
  prompt: PromptRecipe;
}

export function PromptTagsSection({
  availableTags = [],
  onEdit,
  onUpdateTags,
  prompt,
}: PromptTagsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const canEditTags = Boolean(onUpdateTags);

  function resetTagInput() {
    setTagInput('');
    setEditing(false);
  }

  function addTagValue(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      resetTagInput();
      return;
    }

    const existingTag = resolveExistingTagName(availableTags, trimmed);

    onUpdateTags?.(prompt.id, (currentTags) => {
      const currentTagKeys = new Set(currentTags.map(normalizeTag));
      return currentTagKeys.has(normalizeTag(existingTag))
        ? currentTags
        : [...currentTags, existingTag];
    });
    resetTagInput();
  }

  function removeTag(tag: string) {
    onUpdateTags?.(prompt.id, (currentTags) => currentTags.filter((item) => item !== tag));
  }

  function handleAddButtonClick() {
    if (!canEditTags) {
      onEdit?.(prompt.id);
      return;
    }
    setEditing(true);
  }

  function handleUnhandledInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTagValue(tagInput);
    }

    if (event.key === 'Escape') {
      resetTagInput();
    }
  }

  return (
    <div className="px-5 pb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Tags
      </h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {prompt.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]"
          >
            #{tag}
            {canEditTags && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-gray-200"
                aria-label={`Remove ${tag} tag`}
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </span>
        ))}

        {editing ? (
          <TagAutocompleteInput
            availableTags={availableTags}
            className="relative w-36"
            inputClassName="text-[var(--color-text-main)]"
            onBlur={() => addTagValue(tagInput)}
            onSubmitTag={addTagValue}
            onUnhandledKeyDown={handleUnhandledInputKeyDown}
            onValueChange={setTagInput}
            selectedTags={prompt.tags}
            value={tagInput}
          />
        ) : (
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            aria-label="Add tag"
            onClick={handleAddButtonClick}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
