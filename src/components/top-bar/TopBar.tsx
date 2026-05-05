import { SyncStatusBadge } from '../sync';
import { AccountMenuPopover } from './AccountMenuPopover';
import { TopBarSearchTrigger } from './TopBarSearchTrigger';
import type { IAuthService } from '../../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TopBarProps {
  onCommandPaletteOpen: () => void;
  authService?: IAuthService;
  mode?: AppMode;
  userId?: string | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onSignOutSuccess?: () => void;
  syncStatus?: SyncStatus;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map the full SyncStatus union to the subset accepted by SyncStatusBadge.
 * 'syncing' and 'pending-changes' are treated as 'synced' for badge display.
 */
function toBadgeStatus(status: SyncStatus): 'local' | 'synced' | 'offline' {
  if (status === 'offline') return 'offline';
  if (status === 'local') return 'local';
  return 'synced';
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Fixed top bar with macOS-style traffic lights, app title, command palette trigger
 * with ⌘K shortcut hint, sync status badge, and account icon.
 */
export function TopBar({
  onCommandPaletteOpen,
  authService,
  mode = 'local',
  userId = null,
  onAuthSuccess,
  onSignOutSuccess,
  syncStatus,
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b px-4"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* App title */}
      <span
        className="text-sm font-semibold whitespace-nowrap"
        style={{ color: 'var(--color-text-main)' }}
      >
        PromptDock
      </span>

      {/* Centered command palette trigger */}
      <div className="flex flex-1 justify-center">
        <TopBarSearchTrigger
          onCommandPaletteOpen={onCommandPaletteOpen}
        />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Sync status badge */}
        {syncStatus && <SyncStatusBadge status={toBadgeStatus(syncStatus)} />}

        <AccountMenuPopover
          authService={authService}
          mode={mode}
          userId={userId}
          syncStatus={syncStatus}
          onAuthSuccess={onAuthSuccess}
          onSignOutSuccess={onSignOutSuccess}
        />
      </div>
    </header>
  );
}
