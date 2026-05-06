import {
  Archive,
  ChevronRight,
  FileJson,
  Files,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PromptEditorHeaderProps {
  currentFolderName?: string;
  isEditing: boolean;
  isSaving: boolean;
  onArchive?: () => void;
  onCancel: () => void;
  onDuplicate?: () => void;
  onFillFromJson?: () => void;
  onSave: () => void;
  promptTitle?: string;
}

export function PromptEditorHeader({
  currentFolderName,
  isEditing,
  isSaving,
  onArchive,
  onCancel,
  onDuplicate,
  onFillFromJson,
  onSave,
  promptTitle,
}: PromptEditorHeaderProps) {
  return (
    <>
      <nav className="mb-2 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--color-primary)] hover:underline"
        >
          {currentFolderName ?? 'Library'}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-placeholder)]" />
        <span className="text-[var(--color-text-muted)]">
          {isEditing ? (promptTitle ?? 'Edit Prompt') : 'New Prompt'}
        </span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-main)]">
          {isEditing ? 'Edit Prompt' : 'New Prompt'}
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isEditing && (onDuplicate || onArchive) && (
            <>
              {onDuplicate && (
                <Button variant="secondary" size="sm" onClick={onDuplicate}>
                  <Files className="mr-1.5 h-4 w-4" />
                  Duplicate
                </Button>
              )}
              {onArchive && (
                <Button variant="secondary" size="sm" onClick={onArchive}>
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
              )}
            </>
          )}
          {!isEditing && onFillFromJson && (
            <Button variant="secondary" size="sm" onClick={onFillFromJson}>
              <FileJson className="mr-1.5 h-4 w-4" />
              From JSON
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
