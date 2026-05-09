import type { Folder } from '../../types/index';

interface FolderDeleteConfirmationDialogProps {
  folder: Folder;
  onCancel: () => void;
  onConfirm: () => void | Promise<unknown>;
  promptCount: number;
}

function formatPromptCount(count: number): string {
  return `${count} prompt${count === 1 ? '' : 's'}`;
}

export function FolderDeleteConfirmationDialog({
  folder,
  onCancel,
  onConfirm,
  promptCount,
}: FolderDeleteConfirmationDialogProps) {
  const description = promptCount > 0
    ? `${formatPromptCount(promptCount)} will stay in your library and move to No folder.`
    : 'This folder is empty.';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
      role="presentation"
    >
      <div
        aria-describedby="delete-folder-description"
        aria-labelledby="delete-folder-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        role="dialog"
      >
        <h3
          className="text-base font-semibold text-[var(--color-text-main)]"
          id="delete-folder-title"
        >
          Delete "{folder.name}"?
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]"
          id="delete-folder-description"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={() => {
              void onConfirm();
            }}
            type="button"
          >
            Delete folder
          </button>
        </div>
      </div>
    </div>
  );
}
