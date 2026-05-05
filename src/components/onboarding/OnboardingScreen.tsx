import { useOnboardingFlow, type OnboardingChoice } from '../../hooks/use-onboarding-flow';
import { isOnboardingComplete, markOnboardingComplete, ONBOARDING_KEY } from '../../utils/onboarding';
import { OnboardingBenefits } from './OnboardingBenefits';
import { OnboardingHero, OnboardingPrivacyFooter } from './OnboardingHero';
import { OnboardingOptionGrid } from './OnboardingOptionGrid';
import { OnboardingSignInCard } from './OnboardingSignInCard';
import { ONBOARDING_BENEFITS, ONBOARDING_OPTIONS } from './onboarding-data';
import type { IAuthService } from '../../services/interfaces';
export { isOnboardingComplete, markOnboardingComplete, ONBOARDING_KEY };

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface OnboardingScreenProps {
  onComplete: (choice: OnboardingChoice) => void;
  authService?: IAuthService;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * First-run onboarding screen for selecting local or account sync.
 *
 * Wired to:
 * - AppModeStore: sets mode to 'local' for "Start locally"
 * - AuthService: presents sign-in form for "Sign in" option
 * - Persists onboarding-complete flag after successful completion
 */
export function OnboardingScreen({ onComplete, authService }: OnboardingScreenProps) {
  const {
    authError,
    email,
    handleCancelSignIn,
    handleEmailAuthSubmit,
    handleGoogleSignIn,
    handleOptionClick,
    isSubmitting,
    password,
    setEmail,
    setPassword,
    showSignInForm,
  } = useOnboardingFlow({
    authService,
    onComplete,
  });

  return (
    <div className="relative h-full min-h-0 overflow-x-hidden overflow-y-auto bg-[var(--color-background)] px-4 py-5 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(37,99,235,0.08),rgba(20,184,166,0.05)_42%,transparent_78%)] dark:bg-[linear-gradient(140deg,rgba(96,165,250,0.10),rgba(20,184,166,0.08)_40%,transparent_78%)]"
      />

      <main className="relative mx-auto grid min-h-full w-full max-w-6xl grid-cols-1 items-center gap-8 py-4 lg:grid-cols-[0.92fr_1.08fr] lg:py-8">
        <div className="contents lg:block lg:space-y-5">
          <div className="order-1 min-w-0">
            <OnboardingHero />
          </div>

          <div className="order-3 min-w-0 space-y-5">
            <OnboardingBenefits benefits={ONBOARDING_BENEFITS} />
            <OnboardingPrivacyFooter />
          </div>
        </div>

        <section
          aria-labelledby="onboarding-options-heading"
          className="order-2 min-w-0 space-y-4"
        >
          <div className="space-y-1 text-center lg:text-left">
            <h2
              id="onboarding-options-heading"
              className="text-xl font-semibold text-[var(--color-text-main)]"
            >
              Get started
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Choose how you'd like to use PromptDock
            </p>
          </div>

          <OnboardingOptionGrid
            disabled={isSubmitting}
            onSelect={handleOptionClick}
            options={ONBOARDING_OPTIONS}
          />

          {showSignInForm && (
            <OnboardingSignInCard
              authError={authError}
              authServiceAvailable={Boolean(authService)}
              email={email}
              isSubmitting={isSubmitting}
              onCancel={handleCancelSignIn}
              onEmailChange={setEmail}
              onGoogleSignIn={handleGoogleSignIn}
              onPasswordChange={setPassword}
              onSubmit={handleEmailAuthSubmit}
              password={password}
            />
          )}
        </section>
      </main>
    </div>
  );
}
