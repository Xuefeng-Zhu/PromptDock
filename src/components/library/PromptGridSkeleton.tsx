export function PromptGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading prompts">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
          data-testid="skeleton-card"
        >
          <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mb-4 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2">
            <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
