export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-label="Loading settings">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
          data-testid="settings-placeholder"
        >
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
