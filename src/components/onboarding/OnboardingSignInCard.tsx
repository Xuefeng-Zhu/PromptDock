import type { FormEvent } from 'react';
import { AuthDivider } from '../account/AuthDivider';
import { GoogleAuthButton } from '../account/GoogleAuthButton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { AUTH_UNCONFIGURED_MESSAGE } from '../../utils/auth-service-availability';

interface OnboardingSignInCardProps {
  authError: string | null;
  authServiceAvailable: boolean;
  email: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onEmailChange: (value: string) => void;
  onGoogleSignIn: () => void | Promise<void>;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  password: string;
}

export function OnboardingSignInCard({
  authError,
  authServiceAvailable,
  email,
  isSubmitting,
  onCancel,
  onEmailChange,
  onGoogleSignIn,
  onPasswordChange,
  onSubmit,
  password,
}: OnboardingSignInCardProps) {
  const unavailableMessage = authServiceAvailable
    ? null
    : AUTH_UNCONFIGURED_MESSAGE;

  return (
    <Card padding="lg" className="mx-auto max-w-sm">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-main)]">
        Sign in to your account
      </h3>
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
            disabled={isSubmitting || !authServiceAvailable}
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
            disabled={isSubmitting || !authServiceAvailable}
            required
            aria-label="Password"
          />
        </div>

        {unavailableMessage ? (
          <p role="alert" className="text-xs text-red-600">
            {unavailableMessage}
          </p>
        ) : authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !authServiceAvailable}
            className="flex-1"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
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
