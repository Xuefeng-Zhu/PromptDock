import type { PromptRecipe } from '../../types/index';

interface PromptVersionPanelProps {
  label: string;
  version: PromptRecipe;
  accentColor: 'blue' | 'green';
}

export function PromptVersionPanel({
  label,
  version,
  accentColor,
}: PromptVersionPanelProps) {
  const borderColor =
    accentColor === 'blue'
      ? 'border-blue-300 dark:border-blue-700'
      : 'border-green-300 dark:border-green-700';
  const headerBg =
    accentColor === 'blue'
      ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300';

  return (
    <div className={`flex-1 rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${headerBg}`}>
        {label}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</span>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{version.title}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {version.description || '(no description)'}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Body</span>
          <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {version.body}
          </pre>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>Version: {version.version}</span>
          <span>Updated: {version.updatedAt.toLocaleString()}</span>
        </div>
        {version.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {version.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
