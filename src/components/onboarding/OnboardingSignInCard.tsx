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
    <Card padding="lg" className="mx-auto max-w-sm">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-main)]">
        Sign in or create account
      </h3>

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
        className="mt-3 w-full"
      >
        Cancel
      </Button>
    </Card>
  );
}
