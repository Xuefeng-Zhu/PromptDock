import { useId, useMemo, type KeyboardEvent } from 'react';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import { getQuickTagOptions } from '../../utils/tag-options';

interface TagAutocompleteInputProps {
  availableTags?: string[];
  className: string;
  inputClassName?: string;
  onBlur: () => void;
  onSubmitTag: (tag: string) => void;
  onUnhandledKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onValueChange: (value: string) => void;
  selectedTags: string[];
  value: string;
}

export function TagAutocompleteInput({
  availableTags = [],
  className,
  inputClassName = '',
  onBlur,
  onSubmitTag,
  onUnhandledKeyDown,
  onValueChange,
  selectedTags,
  value,
}: TagAutocompleteInputProps) {
  const listboxId = useId();
  const quickTagOptions = useMemo(
    () => getQuickTagOptions({ availableTags, selectedTags, query: value }),
    [availableTags, selectedTags, value],
  );
  const {
    highlightedIndex,
    moveHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(quickTagOptions.length, value);
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
        onSubmitTag(quickTagOptions[clampedHighlightedIndex]);
        return;
      }
    }

    onUnhandledKeyDown(event);
  }

  return (
    <div className={className}>
      <input
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={onBlur}
        autoFocus
        placeholder="tag name"
        className={[
          'w-full rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs outline-none focus:border-[var(--color-primary)]',
          inputClassName,
        ].filter(Boolean).join(' ')}
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
              onClick={() => onSubmitTag(tag)}
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
  );
}
