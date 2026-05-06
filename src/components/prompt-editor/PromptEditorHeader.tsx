import {
  Archive,
  ChevronRight,
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
  onSave,
  promptTitle,
}: PromptEditorHeaderProps) {
  return (
    <>
      <nav className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-md pr-1 text-[var(--color-primary)] hover:underline sm:min-h-0"
        >
          {currentFolderName ?? 'Library'}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-placeholder)]" />
        <span className="min-w-0 truncate text-[var(--color-text-muted)]">
          {isEditing ? (promptTitle ?? 'Edit Prompt') : 'New Prompt'}
        </span>
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-main)]">
          {isEditing ? 'Edit Prompt' : 'New Prompt'}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing && (onDuplicate || onArchive) && (
            <>
              {onDuplicate && (
                <Button variant="secondary" size="sm" onClick={onDuplicate} className="h-10 sm:h-auto">
                  <Files className="mr-1.5 h-4 w-4" />
                  Duplicate
                </Button>
              )}
              {onArchive && (
                <Button variant="secondary" size="sm" onClick={onArchive} className="h-10 sm:h-auto">
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
              )}
            </>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-10 sm:h-auto"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
