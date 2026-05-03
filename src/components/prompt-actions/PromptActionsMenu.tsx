import { useCallback, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDismissablePopover } from '../ui/listbox/use-dismissable-popover';

export type PromptActionMenuItem =
  | {
      danger?: boolean;
      icon: ReactNode;
      label: string;
      onSelect?: () => void;
      type: 'item';
    }
  | { type: 'separator' };

interface PromptActionsMenuProps {
  ariaLabel?: string;
  items: PromptActionMenuItem[];
}

export function PromptActionsMenu({
  ariaLabel = 'More options',
  items,
}: PromptActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  useDismissablePopover({
    containerRef: menuRef,
    onDismiss: closeMenu,
    open,
  });

  const runAction = (action?: () => void) => {
    action?.();
    closeMenu();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded-md hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
        >
          {items.map((item, index) =>
            item.type === 'separator' ? (
              <div
                key={`separator-${index}`}
                className="my-1 border-t border-[var(--color-border)]"
              />
            ) : (
              <PromptActionMenuButton
                key={item.label}
                danger={item.danger}
                icon={item.icon}
                label={item.label}
                onClick={() => runAction(item.onSelect)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

interface PromptActionMenuButtonProps {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function PromptActionMenuButton({
  danger = false,
  icon,
  label,
  onClick,
}: PromptActionMenuButtonProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-[var(--color-text-main)] hover:bg-gray-50',
      ].join(' ')}
    >
      <span className={danger ? 'text-red-500' : 'text-[var(--color-text-muted)]'}>
        {icon}
      </span>
      {label}
    </button>
  );
}
