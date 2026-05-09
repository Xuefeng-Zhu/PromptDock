import { Menu } from 'lucide-react';
import { SyncStatusBadge } from '../sync';
import { AccountMenuPopover } from './AccountMenuPopover';
import { TopBarSearchTrigger } from './TopBarSearchTrigger';
import type { IAuthService } from '../../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCommandPaletteOpen: () => void;
  mobileNavOpen?: boolean;
  onMobileNavToggle?: () => void;
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
 * Fixed top bar with macOS-style traffic lights, app title, centered search bar
 * with ⌘K shortcut hint, sync status badge, and account icon.
 */
export function TopBar({
  searchQuery,
  onSearchChange,
  onCommandPaletteOpen,
  mobileNavOpen = false,
  onMobileNavToggle,
  authService,
  mode = 'local',
  userId = null,
  onAuthSuccess,
  onSignOutSuccess,
  syncStatus,
}: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-3 border-b px-3 py-3 md:flex md:h-14 md:gap-4 md:px-4 md:py-0"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
    >
      {onMobileNavToggle && (
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-navigation"
          onClick={onMobileNavToggle}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)] md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      <span
        className="min-w-0 truncate text-sm font-semibold whitespace-nowrap"
        style={{ color: 'var(--color-text-main)' }}
      >
        PromptDock
      </span>

      <TopBarActions
        authService={authService}
        mode={mode}
        onAuthSuccess={onAuthSuccess}
        onSignOutSuccess={onSignOutSuccess}
        syncStatus={syncStatus}
        userId={userId}
        className="flex justify-self-end md:order-3"
      />

      <div className="col-span-full flex min-w-0 md:order-2 md:col-span-1 md:flex-1 md:justify-center">
        <TopBarSearchTrigger
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onCommandPaletteOpen={onCommandPaletteOpen}
        />
      </div>
    </header>
  );
}

interface TopBarActionsProps {
  authService?: IAuthService;
  className?: string;
  mode: AppMode;
  onAuthSuccess?: (user: AuthUser) => void;
  onSignOutSuccess?: () => void;
  syncStatus?: SyncStatus;
  userId: string | null;
}

function TopBarActions({
  authService,
  className = '',
  mode,
  onAuthSuccess,
  onSignOutSuccess,
  syncStatus,
  userId,
}: TopBarActionsProps) {
  return (
    <div className={`items-center gap-2 ${className}`}>
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
  );
}
