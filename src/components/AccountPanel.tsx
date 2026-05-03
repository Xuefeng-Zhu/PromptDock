import { useEffect } from 'react';
import { useAuthForm } from '../hooks/use-auth-form';
import { AccountAuthForm } from './account/AccountAuthForm';
import { AccountSummary } from './account/AccountSummary';
import { getAccountStatusLabel } from './account/account-display';
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
  }, [authService, isSignedIn, setAuthUser]);

  if (isSignedIn) {
    return (
      <AccountSummary
        authError={authError}
        authUser={authUser}
        compact={isPopover}
        isSubmitting={isSubmitting}
        onSignOut={handleSignOut}
        syncLabel={syncLabel}
        userId={userId}
      />
    );
  }

  return (
    <div>
      {!isPopover && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Account
        </h3>
      )}

      <AccountAuthForm
        authError={authError}
        authFormMode={authFormMode}
        authServiceAvailable={Boolean(authService)}
        compact={isPopover}
        email={email}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onGoogleSignIn={handleGoogleSignIn}
        onPasswordChange={setPassword}
        onSelectMode={selectAuthFormMode}
        onSubmit={handleEmailAuthSubmit}
        password={password}
      />
    </div>
  );
}
