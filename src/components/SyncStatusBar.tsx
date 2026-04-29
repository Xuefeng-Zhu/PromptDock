import type { SyncStatus } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SyncStatusBarProps {
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  pendingChanges?: number;
  onSignInClick?: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface StatusDisplay {
  label: string;
  icon: string;
  colorClass: string;
}

function getStatusDisplay(status: SyncStatus): StatusDisplay {
  switch (status) {
    case 'local':
      return { label: 'Local', icon: '💾', colorClass: 'text-gray-500 dark:text-gray-400' };
    case 'synced':
      return { label: 'Synced', icon: '☁️', colorClass: 'text-green-600 dark:text-green-400' };
    case 'syncing':
      return { label: 'Syncing', icon: '🔄', colorClass: 'text-blue-600 dark:text-blue-400' };
    case 'offline':
      return { label: 'Offline', icon: '📡', colorClass: 'text-orange-500 dark:text-orange-400' };
    case 'pending-changes':
      return { label: 'Pending', icon: '⏳', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Displays the current sync status in the Main Library Screen header.
 *
 * - Local Mode: shows "Local" with a sign-in prompt
 * - Synced Mode: shows "Synced" with last synced timestamp
 * - Syncing: shows "Syncing" indicator
 * - Offline: shows "Offline" with pending changes count
 */
export function SyncStatusBar({
  syncStatus,
  lastSyncedAt,
  pendingChanges = 0,
  onSignInClick,
}: SyncStatusBarProps) {
  const display = getStatusDisplay(syncStatus);

  return (
    <div
      className="flex items-center gap-2 text-xs"
      role="status"
      aria-label={`Sync status: ${display.label}`}
    >
      <span aria-hidden="true">{display.icon}</span>
      <span className={`font-medium ${display.colorClass}`}>{display.label}</span>

      {/* Local mode: sign-in prompt */}
      {syncStatus === 'local' && onSignInClick && (
        <button
          onClick={onSignInClick}
          className="ml-1 text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign in to sync
        </button>
      )}

      {/* Synced mode: last synced timestamp */}
      {syncStatus === 'synced' && lastSyncedAt && (
        <span className="text-gray-400 dark:text-gray-500">
          Last synced {formatTimestamp(lastSyncedAt)}
        </span>
      )}

      {/* Offline: pending changes count */}
      {syncStatus === 'offline' && pendingChanges > 0 && (
        <span className="text-orange-500 dark:text-orange-400">
          {pendingChanges} pending {pendingChanges === 1 ? 'change' : 'changes'}
        </span>
      )}
    </div>
  );
}
