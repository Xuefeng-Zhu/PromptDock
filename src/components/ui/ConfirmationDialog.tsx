import type { ReactNode } from 'react';

interface ConfirmationDialogProps {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  idPrefix: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<unknown>;
  title: ReactNode;
  zIndexClassName?: string;
}

export function ConfirmationDialog({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  idPrefix,
  onCancel,
  onConfirm,
  title,
  zIndexClassName = 'z-50',
}: ConfirmationDialogProps) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/40 px-4`}
      role="presentation"
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        role="dialog"
      >
        <h3
          className="text-base font-semibold text-[var(--color-text-main)]"
          id={titleId}
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]"
          id={descriptionId}
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={() => {
              void onConfirm();
            }}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
