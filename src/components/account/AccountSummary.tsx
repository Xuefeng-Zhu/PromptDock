import { AlertCircle, BadgeCheck, LogOut, RefreshCw } from 'lucide-react';
import type { AuthUser } from '../../types/index';
import { Button } from '../ui/Button';
import { getAccountInitials } from './account-display';

interface AccountSummaryProps {
  authError: string | null;
  authUser: AuthUser | null;
  compact: boolean;
  isSubmitting: boolean;
  onRetrySync?: () => void;
  onSignOut: () => void | Promise<void>;
  syncError: string | null;
  syncLabel: string;
  userId: string | null;
}

export function AccountSummary({
  authError,
  authUser,
  compact,
  isSubmitting,
  onRetrySync,
  onSignOut,
  syncError,
  syncLabel,
  userId,
}: AccountSummaryProps) {
  const initials = getAccountInitials(authUser, userId);
  const displayName = authUser?.displayName?.trim();
  const accountEmail = authUser?.email?.trim();
  const accountTitle = displayName || accountEmail || 'Signed in';

  return (
    <div className={compact ? 'space-y-3' : undefined}>
      {!compact && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Account
        </h3>
      )}

      <div className={compact ? 'flex items-start gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-start'}>
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={[
              'flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]',
              compact ? 'h-10 w-10 text-xs' : 'h-12 w-12 text-sm',
            ].join(' ')}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--color-text-main)]">
              {accountTitle}
            </p>
            {displayName && accountEmail && (
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                {accountEmail}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              {syncError ? (
                <AlertCircle size={14} className="text-red-600" />
              ) : (
                <BadgeCheck size={14} className="text-green-600" />
              )}
              <span className={`text-xs ${syncError ? 'text-red-600' : 'text-green-600'}`}>
                {syncError ? 'Sync setup failed' : syncLabel}
              </span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {syncError && onRetrySync && (
              <RetrySyncButton
                disabled={isSubmitting}
                fullWidth={false}
                onClick={onRetrySync}
              />
            )}
            <SignOutButton
              disabled={isSubmitting}
              fullWidth={false}
              onClick={onSignOut}
            />
          </div>
        )}
      </div>

      {syncError && (
        <p role="alert" className="text-xs text-red-600">
          {syncError}
        </p>
      )}

      {authError && (
        <p role="alert" className="text-xs text-red-600">
          {authError}
        </p>
      )}

      {compact && (
        <div className="space-y-2">
          {syncError && onRetrySync && (
            <RetrySyncButton
              disabled={isSubmitting}
              fullWidth
              onClick={onRetrySync}
            />
          )}
          <SignOutButton
            disabled={isSubmitting}
            fullWidth
            onClick={onSignOut}
          />
        </div>
      )}
    </div>
  );
}

interface RetrySyncButtonProps {
  disabled: boolean;
  fullWidth: boolean;
  onClick: () => void;
}

function RetrySyncButton({ disabled, fullWidth, onClick }: RetrySyncButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={fullWidth ? 'w-full' : 'self-start'}
    >
      <RefreshCw size={16} className="mr-1.5" />
      Try Again
    </Button>
  );
}

interface SignOutButtonProps {
  disabled: boolean;
  fullWidth: boolean;
  onClick: () => void | Promise<void>;
}

function SignOutButton({ disabled, fullWidth, onClick }: SignOutButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={fullWidth ? undefined : 'Sign out'}
      className={fullWidth ? 'w-full' : 'self-start'}
    >
      <LogOut size={16} className="mr-1.5" />
      Sign Out
    </Button>
  );
}
