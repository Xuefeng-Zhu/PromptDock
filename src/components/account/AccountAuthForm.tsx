import type { FormEvent } from 'react';
import type { AuthFormMode } from '../../hooks/use-auth-form';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthDivider } from './AuthDivider';
import { AuthModeTabs } from './AuthModeTabs';
import { GoogleAuthButton } from './GoogleAuthButton';
import { AUTH_UNCONFIGURED_MESSAGE } from '../../utils/auth-service-availability';

interface AccountAuthFormProps {
  authError: string | null;
  authFormMode: AuthFormMode;
  authServiceAvailable: boolean;
  compact: boolean;
  email: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onGoogleSignIn: () => void | Promise<void>;
  onPasswordChange: (value: string) => void;
  onSelectMode: (mode: AuthFormMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  password: string;
}

export function AccountAuthForm({
  authError,
  authFormMode,
  authServiceAvailable,
  compact,
  email,
  isSubmitting,
  onEmailChange,
  onGoogleSignIn,
  onPasswordChange,
  onSelectMode,
  onSubmit,
  password,
}: AccountAuthFormProps) {
  const unavailableMessage = authServiceAvailable
    ? null
    : AUTH_UNCONFIGURED_MESSAGE;

  return (
    <div>
      <AuthModeTabs
        activeMode={authFormMode}
        compact={compact}
        onSelectMode={onSelectMode}
      />

      <form onSubmit={onSubmit} className={compact ? 'space-y-2' : 'space-y-3'}>
        <Input
          id={compact ? 'account-menu-email' : 'auth-email'}
          type="email"
          label="Email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          disabled={isSubmitting || !authServiceAvailable}
          required
        />
        <Input
          id={compact ? 'account-menu-password' : 'auth-password'}
          type="password"
          label="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="********"
          disabled={isSubmitting || !authServiceAvailable}
          required
        />

        {unavailableMessage ? (
          <p role="alert" className="text-xs text-red-600">
            {unavailableMessage}
          </p>
        ) : authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting || !authServiceAvailable}
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

      <AuthDivider compact={compact} />

      <GoogleAuthButton
        onClick={onGoogleSignIn}
        disabled={isSubmitting || !authServiceAvailable}
      />
    </div>
  );
}
