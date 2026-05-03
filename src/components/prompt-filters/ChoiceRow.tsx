import { Check } from 'lucide-react';

interface ChoiceRowProps {
  label: string;
  selected: boolean;
  type: 'radio' | 'checkbox';
  onClick: () => void;
}

export function ChoiceRow({ label, selected, type, onClick }: ChoiceRowProps) {
  return (
    <button
      type="button"
      role={type === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
        selected
          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center border',
          type === 'radio' ? 'rounded-full' : 'rounded',
          selected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
            : 'border-[var(--color-border)] bg-[var(--color-panel)]',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && (
          type === 'radio'
            ? <span className="h-1.5 w-1.5 rounded-full bg-white" />
            : <Check className="h-3 w-3" />
        )}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
