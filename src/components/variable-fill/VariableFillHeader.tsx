import { X } from 'lucide-react';

interface VariableFillHeaderProps {
  onCancel: () => void;
  title: string;
}

export function VariableFillHeader({ onCancel, title }: VariableFillHeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-b px-5 py-4"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-main)' }}>
          {title}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Fill in the variables below to complete your prompt
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Close variable fill modal"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
