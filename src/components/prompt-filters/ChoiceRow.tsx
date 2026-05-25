import { SelectionIndicator } from '../ui/SelectionIndicator';

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
      <SelectionIndicator selected={selected} type={type} />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
