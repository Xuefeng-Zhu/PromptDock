import { AlertTriangle } from 'lucide-react';

export interface ConflictBadgeProps {
  count: number;
  onClick?: () => void;
}

export function ConflictBadge({ count, onClick }: ConflictBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
      aria-label={`${count} unresolved conflict${count !== 1 ? 's' : ''}`}
    >
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      {count} Conflict{count !== 1 ? 's' : ''}
    </button>
  );
}
