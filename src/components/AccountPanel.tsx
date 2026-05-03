import { useEffect } from 'react';
import { BadgeCheck, Chrome, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuthForm } from '../hooks/use-auth-form';
import type { IAuthService } from '../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../types/index';

type AccountPanelVariant = 'card' | 'popover';

export interface AccountPanelProps {
  authService?: IAuthService;
  mode: AppMode;
  userId: string | null;
  syncStatus?: SyncStatus;
  variant?: AccountPanelVariant;
  onAuthSuccess: (user: AuthUser) => void;
  onSignOutSuccess: () => void;
}

function getAccountStatusLabel(mode: AppMode, status?: SyncStatus): string {
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

function getAccountInitials(user: AuthUser | null, fallbackUserId: string | null): string {
  const source = user?.displayName?.trim() || user?.email?.trim() || fallbackUserId || 'Account';
  const nameParts = source
    .split(/[\s@._-]+/)
    .filter(Boolean);

  return nameParts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';
}

export function AccountPanel({
  authService,
  mode,
  userId,
  syncStatus,
  variant = 'card',
  onAuthSuccess,
  onSignOutSuccess,
}: AccountPanelProps) {
  const {
    authError,
    authFormMode,
    authUser,
    email,
    handleEmailAuthSubmit,
    handleGoogleSignIn,
    handleSignOut,
    isSubmitting,
    password,
    selectAuthFormMode,
    setAuthUser,
    setEmail,
    setPassword,
  } = useAuthForm({
    authService,
    onAuthSuccess,
    onSignOutSuccess,
  });

  const isSignedIn = mode !== 'local' && Boolean(userId);
  const isPopover = variant === 'popover';
  const syncLabel = getAccountStatusLabel(mode, syncStatus);

  useEffect(() => {
    if (!isSignedIn) {
      setAuthUser(null);
      return undefined;
    }
    if (!authService) return undefined;

    return authService.onAuthStateChanged(setAuthUser);
  }, [authService, isSignedIn]);

  if (isSignedIn) {
    const initials = getAccountInitials(authUser, userId);
    const displayName = authUser?.displayName?.trim();
    const accountEmail = authUser?.email?.trim();
    const accountTitle = displayName || accountEmail || 'Signed in';

    return (
      <div className={isPopover ? 'space-y-3' : undefined}>
        {!isPopover && (
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Account
          </h3>
        )}
        <div className={isPopover ? 'flex items-start gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-start'}>
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className={[
                'flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] font-semibold text-[var(--color-primary)]',
                isPopover ? 'h-10 w-10 text-xs' : 'h-12 w-12 text-sm',
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
                <BadgeCheck size={14} className="text-green-600" />
                <span className="text-xs text-green-600">
                  {syncLabel}
                </span>
              </div>
            </div>
          </div>
          {!isPopover && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              disabled={isSubmitting}
              aria-label="Sign out"
              className="self-start"
            >
              <LogOut size={16} className="mr-1.5" />
              Sign Out
            </Button>
          )}
        </div>

        {authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        {isPopover && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            disabled={isSubmitting}
            className="w-full"
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {!isPopover && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Account
        </h3>
      )}

      <div className={isPopover ? 'mb-3 flex gap-2' : 'mb-4 flex gap-2'}>
        <button
          type="button"
          onClick={() => {
            selectAuthFormMode('sign-in');
          }}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            isPopover ? 'text-xs' : 'text-sm',
            authFormMode === 'sign-in'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:bg-gray-100',
          ].join(' ')}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            selectAuthFormMode('sign-up');
          }}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            isPopover ? 'text-xs' : 'text-sm',
            authFormMode === 'sign-up'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:bg-gray-100',
          ].join(' ')}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleEmailAuthSubmit} className={isPopover ? 'space-y-2' : 'space-y-3'}>
        <Input
          id={isPopover ? 'account-menu-email' : 'auth-email'}
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          id={isPopover ? 'account-menu-password' : 'auth-password'}
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />

        {authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting || !authService}
          className="w-full"
          aria-label={authFormMode === 'sign-in' ? 'Sign in to account' : 'Create account'}
        >
          {isSubmitting
            ? 'Please wait...'
            : authFormMode === 'sign-in'
              ? 'Sign In'
              : 'Create Account'}
        </Button>
      </form>

      <div className={isPopover ? 'my-3 flex items-center gap-2' : 'my-4 flex items-center gap-3'}>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || !authService}
        className="w-full"
        aria-label="Continue with Google"
      >
        <Chrome size={16} className="mr-2" />
        Continue with Google
      </Button>
    </div>
  );
}
