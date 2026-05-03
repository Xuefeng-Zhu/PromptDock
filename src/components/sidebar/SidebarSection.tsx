import type { ReactNode } from 'react';

interface SidebarSectionProps {
  actionIcon?: ReactNode;
  children: ReactNode;
  label: string;
  onActionClick?: () => void;
}

export function SidebarSection({
  actionIcon,
  children,
  label,
  onActionClick,
}: SidebarSectionProps) {
  return (
    <div className="px-3 pt-4 first:pt-2">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        {actionIcon && onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label={`Add ${label.toLowerCase()}`}
          >
            {actionIcon}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
