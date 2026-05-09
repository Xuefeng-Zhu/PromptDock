interface PromptDeleteConfirmationDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
  promptTitle: string;
}

export function PromptDeleteConfirmationDialog({
  onCancel,
  onConfirm,
  promptTitle,
}: PromptDeleteConfirmationDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="presentation"
    >
      <div
        aria-describedby="delete-prompt-description"
        aria-labelledby="delete-prompt-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        role="dialog"
      >
        <h3
          className="text-base font-semibold text-[var(--color-text-main)]"
          id="delete-prompt-title"
        >
          Delete "{promptTitle}" permanently?
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]"
          id="delete-prompt-description"
        >
          This cannot be undone. Archive the prompt instead if you might need it later.
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
            onClick={onConfirm}
            type="button"
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
