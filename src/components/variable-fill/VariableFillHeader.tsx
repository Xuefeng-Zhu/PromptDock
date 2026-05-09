import { X } from 'lucide-react';

interface VariableFillHeaderProps {
  onCancel: () => void;
  title: string;
}

export function VariableFillHeader({ onCancel, title }: VariableFillHeaderProps) {
  return (
    <div
      className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold" style={{ color: 'var(--color-text-main)' }}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Fill in the variables below to complete your prompt
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Close variable fill modal"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
