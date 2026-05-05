import { useCallback, useState } from 'react';
import { useAuthForm } from './use-auth-form';
import { useAppModeStore } from '../stores/app-mode-store';
import { markOnboardingComplete } from '../utils/onboarding';
import type { IAuthService } from '../services/interfaces';
import type { AuthUser } from '../types/index';

export type OnboardingChoice = 'local' | 'signin';

interface UseOnboardingFlowOptions {
  authService?: IAuthService;
  onComplete: (choice: OnboardingChoice) => void;
}

export function useOnboardingFlow({
  authService,
  onComplete,
}: UseOnboardingFlowOptions) {
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);

  const [showSignInForm, setShowSignInForm] = useState(false);

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

  const handleOptionClick = useCallback(
    (key: OnboardingChoice) => {
      switch (key) {
        case 'local':
          handleStartLocally();
          break;
        case 'signin':
          handleSignInClick();
          break;
      }
    },
    [handleStartLocally, handleSignInClick],
  );

  return {
    ...authForm,
    handleCancelSignIn,
    handleOptionClick,
    isSubmitting: authForm.isSubmitting,
    showSignInForm,
  };
}
