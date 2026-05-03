import type { KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

interface EditorTagFieldProps {
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onShowTagInputChange: (show: boolean) => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showTagInput: boolean;
  tagInput: string;
  tags: string[];
}

export function EditorTagField({
  onAddTag,
  onRemoveTag,
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
          <button
            key={tag}
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
            aria-label={`Remove ${tag} tag`}
          >
            #{tag}
          </button>
        ))}
        {showTagInput ? (
          <input
            type="text"
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={onAddTag}
            autoFocus
            placeholder="tag name"
            className="w-24 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs outline-none focus:border-[var(--color-primary)]"
            aria-label="Add tag"
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
