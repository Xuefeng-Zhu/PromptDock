import type { KeyboardEvent } from 'react';
import type { Folder } from '../../types/index';
import { CountedInputField, CountedTextareaField } from './CountedField';
import { EditorFavoriteField } from './EditorFavoriteField';
import { EditorFolderField } from './EditorFolderField';
import { EditorTagField } from './EditorTagField';

interface SelectOption {
  label: string;
  value: string;
}

interface PromptBasicsFieldsProps {
  availableTags: string[];
  description: string;
  favorite: boolean;
  folderId: string | null;
  folderOptions: SelectOption[];
  onAddTag: () => void;
  onDescriptionChange: (description: string) => void;
  onFavoriteChange: (favorite: boolean) => void;
  onCreateFolder?: (name: string) => Folder | void;
  onFolderChange: (folderId: string | null) => void;
  onRemoveTag: (tag: string) => void;
  onSelectTag: (tag: string) => void;
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
  availableTags,
  description,
  favorite,
  folderId,
  folderOptions,
  onAddTag,
  onDescriptionChange,
  onFavoriteChange,
  onCreateFolder,
  onFolderChange,
  onRemoveTag,
  onSelectTag,
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
      <CountedInputField
        id="editor-title"
        label="Title"
        maxLength={100}
        placeholder="e.g. Summarize Text"
        value={title}
        onChange={onTitleChange}
      />

      <CountedTextareaField
        id="editor-description"
        label="Description"
        maxLength={300}
        placeholder="Describe what this prompt does"
        rows={3}
        value={description}
        onChange={onDescriptionChange}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <EditorTagField
          availableTags={availableTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onSelectTag={onSelectTag}
          onShowTagInputChange={onShowTagInputChange}
          onTagInputChange={onTagInputChange}
          onTagKeyDown={onTagKeyDown}
          showTagInput={showTagInput}
          tagInput={tagInput}
          tags={tags}
        />

        <EditorFolderField
          folderId={folderId}
          folderOptions={folderOptions}
          onCreateFolder={onCreateFolder}
          onFolderChange={onFolderChange}
        />

        <EditorFavoriteField
          favorite={favorite}
          onFavoriteChange={onFavoriteChange}
        />
      </div>
    </>
  );
}
