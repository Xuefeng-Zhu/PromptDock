import { useCallback, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { AccountPanel } from '../account';
import { useDismissablePopover } from '../ui/listbox/use-dismissable-popover';
import type { IAuthService } from '../../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../../types/index';

interface AccountMenuPopoverProps {
  authService?: IAuthService;
  mode: AppMode;
  onAuthSuccess?: (user: AuthUser) => void;
  onSignOutSuccess?: () => void;
  syncStatus?: SyncStatus;
  userId: string | null;
}

export function AccountMenuPopover({
  authService,
  mode,
  onAuthSuccess,
  onSignOutSuccess,
  syncStatus,
  userId,
}: AccountMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  useDismissablePopover({
    containerRef: accountMenuRef,
    onDismiss: closePopover,
    open,
  });

  return (
    <div className="relative" ref={accountMenuRef}>
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <User className="h-4 w-4" />
      </button>

      {open && (
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
              closePopover();
            }}
          />
        </div>
      )}
    </div>
  );
}
