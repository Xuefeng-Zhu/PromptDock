import { useId, useMemo, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import { getQuickTagOptions } from '../../utils/tag-options';
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
  const listboxId = useId();
  const quickTagOptions = useMemo(
    () => getQuickTagOptions({ availableTags, selectedTags: tags, query: tagInput }),
    [availableTags, tagInput, tags],
  );
  const {
    highlightedIndex,
    moveHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(quickTagOptions.length, tagInput);
  const clampedHighlightedIndex = Math.min(highlightedIndex, quickTagOptions.length - 1);
  const activeOptionId =
    quickTagOptions.length > 0 ? `${listboxId}-option-${clampedHighlightedIndex}` : undefined;

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
        onSelectTag(quickTagOptions[clampedHighlightedIndex]);
        return;
      }
    }

    onTagKeyDown(event);
  }

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
          <div className="relative w-44">
            <input
              type="text"
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={onAddTag}
              autoFocus
              placeholder="tag name"
              className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs outline-none focus:border-[var(--color-primary)]"
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
                    onClick={() => onSelectTag(tag)}
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
