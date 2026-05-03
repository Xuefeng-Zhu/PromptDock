interface QuickLauncherErrorProps {
  message: string | null;
  variant: 'inline' | 'floating';
}

export function QuickLauncherError({ message, variant }: QuickLauncherErrorProps) {
  if (!message) return null;

  if (variant === 'floating') {
    return (
      <div
        role="alert"
        className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/40 dark:text-red-200"
      >
        {message}
      </div>
    );
  }

  return (
    <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-300">
      {message}
    </p>
  );
}
