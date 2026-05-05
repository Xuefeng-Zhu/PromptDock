import type { FormEvent } from 'react';
import type { AuthFormMode } from '../../hooks/use-auth-form';
import { AccountAuthForm } from '../account/AccountAuthForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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
    <Card
      padding="lg"
      className="mx-auto w-full max-w-xl border-blue-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-blue-900/50 dark:bg-gray-900"
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
          Sign in or create account
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
          Restore synced recipes or create a PromptDock account.
        </p>
      </div>

      <AccountAuthForm
        authError={authError}
        authFormMode={authFormMode}
        authServiceAvailable={authServiceAvailable}
        compact={false}
        email={email}
        isSubmitting={isSubmitting}
        onEmailChange={onEmailChange}
        onGoogleSignIn={onGoogleSignIn}
        onPasswordChange={onPasswordChange}
        onSelectMode={onSelectMode}
        onSubmit={onSubmit}
        password={password}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onCancel}
        className="mt-3 h-10 w-full"
      >
        Cancel
      </Button>
    </Card>
  );
}
