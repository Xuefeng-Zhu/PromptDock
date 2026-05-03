import { useCallback, useState } from 'react';
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Copy,
  Files,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PromptEditorHeaderProps {
  currentFolderName?: string;
  isEditing: boolean;
  isSaving: boolean;
  onArchive?: () => void;
  onCancel: () => void;
  onCopy?: () => void;
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
  onCopy,
  onDuplicate,
  onSave,
  promptTitle,
}: PromptEditorHeaderProps) {
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const handleSaveAndClose = useCallback(() => {
    onSave();
    setShowSaveOptions(false);
  }, [onSave]);

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
        <div className="flex items-center gap-2">
          {isEditing && (onDuplicate || onArchive || onCopy) && (
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
              {onCopy && (
                <Button variant="secondary" size="sm" onClick={onCopy}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy
                </Button>
              )}
            </>
          )}
          <div className="relative flex">
            <Button
              variant="primary"
              size="sm"
              className="rounded-r-none"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-l-none border-l border-white/20 px-2"
              aria-label="Save options"
              disabled={isSaving}
              onClick={() => setShowSaveOptions((prev) => !prev)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showSaveOptions && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="flex w-full items-center px-3 py-2 text-sm text-[var(--color-text-main)] hover:bg-gray-100 transition-colors"
                >
                  Save and Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
