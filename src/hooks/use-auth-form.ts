import { useCallback, useRef, useState, type FormEvent } from 'react';
import type { AuthResult, AuthUser } from '../types/index';
import type { IAuthService } from '../services/interfaces';
import { authErrorMessage } from '../utils/auth-error-message';
import {
  AUTH_UNCONFIGURED_MESSAGE,
  isAuthServiceAvailable,
} from '../utils/auth-service-availability';
import { formatErrorMessage } from '../utils/error-message';

export type AuthFormMode = 'sign-in' | 'sign-up';

interface UseAuthFormOptions {
  authService?: IAuthService;
  initialMode?: AuthFormMode;
  onAuthSuccess: (user: AuthUser) => void;
  onSignOutSuccess?: () => void;
  unavailableMessage?: string;
}

/**
 * Manages email/password, Google, and sign-out form state for account panels.
 * AuthService owns Firebase calls; this hook normalizes user-facing errors,
 * clears sensitive fields on success, and notifies callers when app mode should change.
 */
export function useAuthForm({
  authService,
  initialMode = 'sign-in',
  onAuthSuccess,
  onSignOutSuccess,
  unavailableMessage = AUTH_UNCONFIGURED_MESSAGE,
}: UseAuthFormOptions) {
  const [authFormMode, setAuthFormMode] = useState<AuthFormMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const authServiceAvailable = isAuthServiceAvailable(authService);
  const canSubmitAuth = Boolean(authService) && authServiceAvailable;

  const beginSubmitting = useCallback(() => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setIsSubmitting(true);
    return true;
  }, []);

  const finishSubmitting = useCallback(() => {
    submittingRef.current = false;
    setIsSubmitting(false);
  }, []);

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
      if (!canSubmitAuth || !authService) {
        setAuthError(unavailableMessage);
        return;
      }
      if (!beginSubmitting()) return;

      setAuthError(null);
      try {
        const result = authFormMode === 'sign-in'
          ? await authService.signIn(email, password)
          : await authService.signUp(email, password);
        completeAuth(result);
      } finally {
        finishSubmitting();
      }
    },
    [
      authFormMode,
      authService,
      beginSubmitting,
      canSubmitAuth,
      completeAuth,
      email,
      finishSubmitting,
      password,
      unavailableMessage,
    ],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (!canSubmitAuth || !authService) {
      setAuthError(unavailableMessage);
      return;
    }
    if (!beginSubmitting()) return;

    setAuthError(null);
    try {
      const result = await authService.signInWithGoogle();
      completeAuth(result);
    } finally {
      finishSubmitting();
    }
  }, [authService, beginSubmitting, canSubmitAuth, completeAuth, finishSubmitting, unavailableMessage]);

  const handleSignOut = useCallback(async () => {
    if (!authService) {
      setAuthError('Cloud sign-out is unavailable in this build.');
      return;
    }
    if (!beginSubmitting()) return;

    setAuthError(null);
    try {
      await authService.signOut();
      setAuthUser(null);
      onSignOutSuccess?.();
    } catch (err) {
      setAuthError(`Failed to sign out: ${formatErrorMessage(err)}`);
    } finally {
      finishSubmitting();
    }
  }, [authService, beginSubmitting, finishSubmitting, onSignOutSuccess]);

  return {
    authError,
    authFormMode,
    authServiceAvailable,
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
