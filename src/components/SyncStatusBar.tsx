import { useAppModeStore } from '../stores/app-mode-store';

export function SyncStatusBar() {
  const { syncStatus, lastSyncedAt } = useAppModeStore();
  const labels: Record<string, string> = {
    local: '📁 Local',
    synced: '☁️ Synced',
    syncing: '🔄 Syncing',
    offline: '📴 Offline',
    'pending-changes': '⏳ Pending',
  };
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>{labels[syncStatus] ?? syncStatus}</span>
      {lastSyncedAt && <span>· Last synced {lastSyncedAt.toLocaleTimeString()}</span>}
    </div>
  );
}
