import { useEffect, useRef, useState } from 'react';
import { Search, User } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { AccountPanel } from './AccountPanel';
import type { IAuthService } from '../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
 * Fixed top bar with macOS-style traffic lights, app title, centered search bar
 * with ⌘K shortcut hint, sync status badge, and account icon.
 */
export function TopBar({
  searchQuery,
  onSearchChange,
  onCommandPaletteOpen,
  authService,
  mode = 'local',
  userId = null,
  onAuthSuccess,
  onSignOutSuccess,
  syncStatus,
}: TopBarProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

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

      {/* Centered search bar */}
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--color-text-placeholder)' }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClick={onCommandPaletteOpen}
            placeholder="Search…"
            aria-label="Search prompts"
            className="w-full rounded-lg border py-1.5 pl-9 pr-14 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-main)',
            }}
          />
          <kbd
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs font-medium"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-panel)',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Sync status badge */}
        {syncStatus && <SyncStatusBadge status={toBadgeStatus(syncStatus)} />}

        {/* Account menu */}
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            aria-label="Account"
            aria-expanded={accountMenuOpen}
            aria-haspopup="dialog"
            onClick={() => setAccountMenuOpen((current) => !current)}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <User className="h-4 w-4" />
          </button>

          {accountMenuOpen && (
            <div
              role="dialog"
              aria-label="Account"
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3 shadow-lg"
            >
              <AccountPanel
                authService={authService}
                mode={mode}
                userId={userId}
                syncStatus={syncStatus}
                variant="popover"
                onAuthSuccess={(user) => onAuthSuccess?.(user)}
                onSignOutSuccess={() => {
                  onSignOutSuccess?.();
                  setAccountMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
