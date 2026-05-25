import { Check } from 'lucide-react';

interface SelectionIndicatorProps {
  className?: string;
  selected: boolean;
  type?: 'checkbox' | 'radio';
}

export function SelectionIndicator({
  className = '',
  selected,
  type = 'checkbox',
}: SelectionIndicatorProps) {
  return (
    <span
      className={[
        'flex h-4 w-4 shrink-0 items-center justify-center border',
        type === 'radio' ? 'rounded-full' : 'rounded',
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] bg-[var(--color-panel)]',
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {selected && (
        type === 'radio'
          ? <span className="h-1.5 w-1.5 rounded-full bg-white" />
          : <Check className="h-3 w-3" />
      )}
    </span>
  );
}
