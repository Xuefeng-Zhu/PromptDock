import type { FormEvent } from 'react';
import { AuthDivider } from '../account/AuthDivider';
import { GoogleAuthButton } from '../account/GoogleAuthButton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

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
  return (
    <Card
      padding="lg"
      className="mx-auto w-full max-w-xl border-blue-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-blue-900/50 dark:bg-gray-900"
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
          Sign in to your account
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
          Restore synced recipes from your existing PromptDock account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        {authError && (
          <p role="alert" className="text-xs text-red-600">
            {authError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="h-10 flex-1"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            className="h-10 sm:w-28"
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
