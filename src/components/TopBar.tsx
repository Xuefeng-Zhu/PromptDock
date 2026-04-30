import { Search, RefreshCw, User } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { SyncStatus } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCommandPaletteOpen: () => void;
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
      {/* macOS traffic light placeholders */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="inline-block h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#28C840]" />
      </div>

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

        {/* Sync / refresh button */}
        <button
          type="button"
          aria-label="Sync"
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Account button */}
        <button
          type="button"
          aria-label="Account"
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
