import { useEffect, useState } from 'react';
import { initializeApp, ThemeManager } from '../App';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { QuickLauncherWindow } from './QuickLauncherWindow';

/**
 * Lightweight bootstrap for the separate quick-launcher webview.
 * It needs repositories and stores, but not another sync listener or hotkey owner.
 */
export function QuickLauncherApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp({
      seedDefaultData: false,
      registerGlobalHotkey: false,
      enableBackgroundServices: true,
      restoreAuthSession: true,
      syncMigrationChoice: 'fresh',
      analyticsSurface: 'quick_launcher',
    })
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Failed to initialize quick launcher:', err);
        setError(String(err));
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-6 text-center dark:bg-gray-800">
        <div>
          <h1 className="mb-2 text-sm font-semibold text-red-600 dark:text-red-300">
            Launcher failed to load
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-800">
        <div
          className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"
          role="status"
          aria-label="Loading quick launcher"
        />
      </div>
    );
  }

  return (
    <>
      <ThemeManager />
      <ErrorBoundary>
        <QuickLauncherWindow />
      </ErrorBoundary>
    </>
  );
}
