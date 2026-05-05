import type { FormEvent } from 'react';
import type { AuthFormMode } from '../../hooks/use-auth-form';
import { AuthDivider } from '../account/AuthDivider';
import { AuthModeTabs } from '../account/AuthModeTabs';
import { GoogleAuthButton } from '../account/GoogleAuthButton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface OnboardingSignInCardProps {
  authError: string | null;
  authFormMode: AuthFormMode;
  authServiceAvailable: boolean;
  email: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onEmailChange: (value: string) => void;
  onGoogleSignIn: () => void | Promise<void>;
  onPasswordChange: (value: string) => void;
  onSelectMode: (mode: AuthFormMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  password: string;
}

export function OnboardingSignInCard({
  authError,
  authFormMode,
  authServiceAvailable,
  email,
  isSubmitting,
  onCancel,
  onEmailChange,
  onGoogleSignIn,
  onPasswordChange,
  onSelectMode,
  onSubmit,
  password,
}: OnboardingSignInCardProps) {
  return (
    <Card padding="lg" className="mx-auto max-w-sm">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-main)]">
        Sign in or create account
      </h3>
      <AuthModeTabs
        activeMode={authFormMode}
        compact={false}
        onSelectMode={onSelectMode}
      />
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="onboarding-email"
            className="mb-1 block text-xs font-medium text-[var(--color-text-main)]"
          >
            Email
          </label>
          <Input
            id="onboarding-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
            required
            aria-label="Email"
          />
        </div>
        <div>
          <label
            htmlFor="onboarding-password"
            className="mb-1 block text-xs font-medium text-[var(--color-text-main)]"
          >
            Password
          </label>
          <Input
            id="onboarding-password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="********"
            required
            aria-label="Password"
          />
        </div>

        {authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? authFormMode === 'sign-in'
                ? 'Signing in...'
                : 'Creating account...'
              : authFormMode === 'sign-in'
                ? 'Sign In'
                : 'Create Account'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>

      <AuthDivider />

      <GoogleAuthButton
        onClick={onGoogleSignIn}
        disabled={isSubmitting || !authServiceAvailable}
      />
    </Card>
  );
}
