import { ArrowLeft } from 'lucide-react';

interface ConflictCenterHeaderProps {
  conflictCount: number;
  onBack?: () => void;
}

export function ConflictCenterHeader({
  conflictCount,
  onBack,
}: ConflictCenterHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Back to library"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Conflict Center</h1>
        {conflictCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {conflictCount} unresolved
          </span>
        )}
      </div>
    </header>
  );
}
