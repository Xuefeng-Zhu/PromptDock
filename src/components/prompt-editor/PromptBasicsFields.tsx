import type { KeyboardEvent } from 'react';
import { Plus, Star } from 'lucide-react';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { countChars } from '../../utils/text-counts';

interface SelectOption {
  label: string;
  value: string;
}

interface PromptBasicsFieldsProps {
  description: string;
  favorite: boolean;
  folderId: string | null;
  folderOptions: SelectOption[];
  onAddTag: () => void;
  onDescriptionChange: (description: string) => void;
  onFavoriteChange: (favorite: boolean) => void;
  onFolderChange: (folderId: string | null) => void;
  onRemoveTag: (tag: string) => void;
  onShowTagInputChange: (show: boolean) => void;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onTitleChange: (title: string) => void;
  showTagInput: boolean;
  tagInput: string;
  tags: string[];
  title: string;
}

export function PromptBasicsFields({
  description,
  favorite,
  folderId,
  folderOptions,
  onAddTag,
  onDescriptionChange,
  onFavoriteChange,
  onFolderChange,
  onRemoveTag,
  onShowTagInputChange,
  onTagInputChange,
  onTagKeyDown,
  onTitleChange,
  showTagInput,
  tagInput,
  tags,
  title,
}: PromptBasicsFieldsProps) {
  return (
    <>
      <div className="mb-6">
        <label
          htmlFor="editor-title"
          className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
        >
          Title
        </label>
        <div className="relative">
          <input
            id="editor-title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="e.g. Summarize Text"
            maxLength={100}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
            {countChars(title)}/100
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label
          htmlFor="editor-description"
          className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
        >
          Description
        </label>
        <div className="relative">
          <textarea
            id="editor-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Describe what this prompt does"
            maxLength={300}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors resize-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <span className="absolute right-4 bottom-3 text-xs text-[var(--color-text-muted)]">
            {countChars(description)}/300
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-6">
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

        <Select
          label="Folder"
          options={folderOptions}
          value={folderId ?? ''}
          onChange={(event) => onFolderChange(event.target.value || null)}
          placeholder="Select a folder"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
            Favorite
          </label>
          <div className="flex items-center gap-2">
            <Toggle
              checked={favorite}
              onChange={onFavoriteChange}
              label=""
            />
            <Star
              className={[
                'h-5 w-5 transition-colors',
                favorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-[var(--color-text-placeholder)]',
              ].join(' ')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
