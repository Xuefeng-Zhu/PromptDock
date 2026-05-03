import { useCallback, useState } from 'react';
import { useAuthForm } from './use-auth-form';
import { useAppModeStore } from '../stores/app-mode-store';
import { markOnboardingComplete } from '../utils/onboarding';
import type { IAuthService } from '../services/interfaces';
import type { AuthUser } from '../types/index';

export type OnboardingChoice = 'local' | 'sync' | 'signin';

export interface OnboardingSyncService {
  transitionToSynced: (
    userId: string,
    workspaceId: string,
    localPrompts: never[],
    migrationChoice: 'fresh',
  ) => Promise<void>;
}

interface UseOnboardingFlowOptions {
  authService?: IAuthService;
  onComplete: (choice: OnboardingChoice) => void;
  syncService?: OnboardingSyncService;
}

export function useOnboardingFlow({
  authService,
  onComplete,
  syncService,
}: UseOnboardingFlowOptions) {
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);

  const [showSignInForm, setShowSignInForm] = useState(false);
  const [isSyncSubmitting, setIsSyncSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(
    (user: AuthUser) => {
      setUserId(user.uid);
      setMode('synced');
      markOnboardingComplete();
      onComplete('signin');
    },
    [setMode, setUserId, onComplete],
  );

  const authForm = useAuthForm({
    authService,
    onAuthSuccess: handleAuthSuccess,
  });
  const { clearAuthError } = authForm;

  const handleStartLocally = useCallback(() => {
    setMode('local');
    markOnboardingComplete();
    onComplete('local');
  }, [setMode, onComplete]);

  const handleSignInClick = useCallback(() => {
    setShowSignInForm(true);
    clearAuthError();
  }, [clearAuthError]);

  const handleCancelSignIn = useCallback(() => {
    setShowSignInForm(false);
    clearAuthError();
  }, [clearAuthError]);

  const handleEnableSync = useCallback(async () => {
    setSyncError(null);
    setIsSyncSubmitting(true);
    try {
      if (syncService) {
        const guestUserId = `guest-${Date.now()}`;
        const guestWorkspaceId = `workspace-${guestUserId}`;
        setUserId(guestUserId);
        await syncService.transitionToSynced(guestUserId, guestWorkspaceId, [], 'fresh');
      } else {
        setMode('synced');
      }
      markOnboardingComplete();
      onComplete('sync');
    } catch (err) {
      setSyncError(
        `Failed to enable sync: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSyncSubmitting(false);
    }
  }, [syncService, setMode, setUserId, onComplete]);

  const handleOptionClick = useCallback(
    (key: OnboardingChoice) => {
      switch (key) {
        case 'local':
          handleStartLocally();
          break;
        case 'signin':
          handleSignInClick();
          break;
        case 'sync':
          void handleEnableSync();
          break;
      }
    },
    [handleStartLocally, handleSignInClick, handleEnableSync],
  );

  return {
    ...authForm,
    handleCancelSignIn,
    handleOptionClick,
    isSubmitting: authForm.isSubmitting || isSyncSubmitting,
    showSignInForm,
    syncError,
  };
}
