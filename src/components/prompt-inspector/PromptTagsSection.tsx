import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import type { PromptRecipe } from '../../types/index';

interface PromptTagsSectionProps {
  availableTags?: string[];
  onEdit?: (id: string) => void;
  onUpdateTags?: (id: string, updateTags: (tags: string[]) => string[]) => void;
  prompt: PromptRecipe;
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function PromptTagsSection({
  availableTags = [],
  onEdit,
  onUpdateTags,
  prompt,
}: PromptTagsSectionProps) {
  const listboxId = useId();
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const canEditTags = Boolean(onUpdateTags);
  const selectedTagKeys = useMemo(
    () => new Set(prompt.tags.map(normalizeTag)),
    [prompt.tags],
  );
  const quickTagOptions = useMemo(() => {
    const query = normalizeTag(tagInput);
    const seen = new Set<string>();

    return availableTags
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '')
      .filter((tag) => {
        const key = normalizeTag(tag);
        if (selectedTagKeys.has(key) || seen.has(key)) return false;
        seen.add(key);
        return query === '' || key.includes(query);
      })
      .slice(0, 6);
  }, [availableTags, selectedTagKeys, tagInput]);
  const {
    highlightedIndex,
    moveHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(quickTagOptions.length, tagInput);
  const clampedHighlightedIndex = Math.min(highlightedIndex, quickTagOptions.length - 1);
  const activeOptionId =
    quickTagOptions.length > 0 ? `${listboxId}-option-${clampedHighlightedIndex}` : undefined;

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

    const normalized = normalizeTag(trimmed);
    const existingTag =
      availableTags.find((candidate) => normalizeTag(candidate) === normalized)?.trim()
      ?? trimmed;

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

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (quickTagOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveHighlightedIndex(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveHighlightedIndex(-1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        addTagValue(quickTagOptions[clampedHighlightedIndex]);
        return;
      }
    }

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
          <div className="relative w-36">
            <input
              type="text"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={() => addTagValue(tagInput)}
              autoFocus
              placeholder="tag name"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
              aria-label="Add tag"
              aria-autocomplete="list"
              aria-controls={quickTagOptions.length > 0 ? listboxId : undefined}
              aria-expanded={quickTagOptions.length > 0}
              aria-haspopup="listbox"
              aria-activedescendant={activeOptionId}
              role="combobox"
            />

            {quickTagOptions.length > 0 && (
              <div
                id={listboxId}
                role="listbox"
                aria-label="Existing tags"
                className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-lg"
              >
                {quickTagOptions.map((tag, index) => (
                  <button
                    key={tag}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === clampedHighlightedIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => addTagValue(tag)}
                    className={[
                      'block w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                      index === clampedHighlightedIndex
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-main)] hover:bg-gray-50',
                    ].join(' ')}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
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
