import type { ReactNode } from 'react';

interface SidebarItemProps {
  count?: number;
  icon: ReactNode;
  iconColor?: string;
  isActive: boolean;
  itemKey: string;
  label: string;
  onSelect: (key: string) => void;
}

export function SidebarItem({
  count,
  icon,
  iconColor = '',
  isActive,
  itemKey,
  label,
  onSelect,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      aria-selected={isActive}
      onClick={() => onSelect(itemKey)}
      className={[
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150',
        isActive
          ? 'bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]'
          : 'text-[var(--color-text-main)] hover:bg-gray-100',
      ].join(' ')}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-[var(--color-primary)]' : iconColor}`} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="flex-shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
          {count}
        </span>
      )}
    </button>
  );
}
