import type { AppMode, AuthUser, SyncStatus } from '../../types/index';

export function getAccountStatusLabel(mode: AppMode, status?: SyncStatus): string {
  if (mode === 'offline-synced') return 'Offline sync';

  if (mode === 'synced') {
    switch (status) {
      case 'offline':
        return 'Offline sync';
      case 'syncing':
        return 'Syncing';
      case 'pending-changes':
        return 'Pending changes';
      case 'synced':
      case 'local':
      default:
        return 'Synced';
    }
  }

  switch (status) {
    case 'local':
      return 'Local mode';
    case 'offline':
      return 'Offline sync';
    case 'syncing':
      return 'Syncing';
    case 'pending-changes':
      return 'Pending changes';
    case 'synced':
      return 'Synced';
    default:
      return 'Account';
  }
}

export function getAccountInitials(user: AuthUser | null, fallbackUserId: string | null): string {
  const source = user?.displayName?.trim() || user?.email?.trim() || fallbackUserId || 'Account';
  const nameParts = source
    .split(/[\s@._-]+/)
    .filter(Boolean);

  return nameParts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';
}
