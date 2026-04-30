import { HardDrive, Cloud, WifiOff } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SyncStatusBadgeProps {
  status: 'local' | 'synced' | 'offline';
}

// ─── Status Config ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  SyncStatusBadgeProps['status'],
  { icon: React.ReactNode; label: string }
> = {
  local: {
    icon: <HardDrive className="h-3.5 w-3.5" />,
    label: 'Local',
  },
  synced: {
    icon: <Cloud className="h-3.5 w-3.5" />,
    label: 'Synced',
  },
  offline: {
    icon: <WifiOff className="h-3.5 w-3.5" />,
    label: 'Offline',
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Compact badge showing the current sync state with both an icon and a text
 * label. Status is conveyed by icon and text — not color alone — to meet
 * accessibility requirements.
 */
export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const { icon, label } = statusConfig[status];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        'bg-gray-100 text-[var(--color-text-muted)]',
      ].join(' ')}
    >
      {icon}
      {label}
    </span>
  );
}
