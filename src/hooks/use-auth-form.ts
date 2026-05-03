import { useCallback, useState, type FormEvent } from 'react';
import type { AuthResult, AuthUser } from '../types/index';
import type { IAuthService } from '../services/interfaces';
import { authErrorMessage } from '../utils/auth-error-message';

export type AuthFormMode = 'sign-in' | 'sign-up';

interface UseAuthFormOptions {
  authService?: IAuthService;
  initialMode?: AuthFormMode;
  onAuthSuccess: (user: AuthUser) => void;
  onSignOutSuccess?: () => void;
  unavailableMessage?: string;
}

export function useAuthForm({
  authService,
  initialMode = 'sign-in',
  onAuthSuccess,
  onSignOutSuccess,
  unavailableMessage = 'Cloud sign-in is unavailable in this build.',
}: UseAuthFormOptions) {
  const [authFormMode, setAuthFormMode] = useState<AuthFormMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const selectAuthFormMode = useCallback((mode: AuthFormMode) => {
    setAuthFormMode(mode);
    setAuthError(null);
  }, []);

  const completeAuth = useCallback(
    (result: AuthResult) => {
      if (result.success) {
        setAuthUser(result.user);
        setEmail('');
        setPassword('');
        setAuthError(null);
        onAuthSuccess(result.user);
      } else {
        setAuthError(authErrorMessage(result.error));
      }
    },
    [onAuthSuccess],
  );

  const handleEmailAuthSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!authService) {
        setAuthError(unavailableMessage);
        return;
      }

      setAuthError(null);
      setIsSubmitting(true);
      try {
        const result = authFormMode === 'sign-in'
          ? await authService.signIn(email, password)
          : await authService.signUp(email, password);
        completeAuth(result);
      } finally {
        setIsSubmitting(false);
      }
    },
    [authFormMode, authService, completeAuth, email, password, unavailableMessage],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (!authService) {
      setAuthError(unavailableMessage);
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      const result = await authService.signInWithGoogle();
      completeAuth(result);
    } finally {
      setIsSubmitting(false);
    }
  }, [authService, completeAuth, unavailableMessage]);

  const handleSignOut = useCallback(async () => {
    if (!authService) {
      setAuthError('Cloud sign-out is unavailable in this build.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      await authService.signOut();
      setAuthUser(null);
      onSignOutSuccess?.();
    } catch (err) {
      setAuthError(`Failed to sign out: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [authService, onSignOutSuccess]);

  return {
    authError,
    authFormMode,
    authUser,
    clearAuthError,
    email,
    handleEmailAuthSubmit,
    handleGoogleSignIn,
    handleSignOut,
    isSubmitting,
    password,
    selectAuthFormMode,
    setAuthError,
    setAuthUser,
    setEmail,
    setPassword,
  };
}
