import { CheckCircle } from 'lucide-react';

export function ConflictEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle className="mb-3 h-12 w-12 text-green-400" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        No conflicts to resolve
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        All your prompts are in sync.
      </p>
    </div>
  );
}
