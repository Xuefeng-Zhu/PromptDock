import { useOnboardingFlow, type OnboardingChoice, type OnboardingSyncService } from '../../hooks/use-onboarding-flow';
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
  syncService?: OnboardingSyncService;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * First-run onboarding screen matching the high-fidelity mockup.
 * Displays a welcome header, 3-column option cards with CTA buttons,
 * 4-column benefit cards with descriptions, and a privacy footer.
 *
 * Wired to:
 * - AppModeStore: sets mode to 'local' for "Start locally"
 * - AuthService: presents sign-in form for "Sign in" option
 * - SyncService: initiates transitionToSynced for "Enable sync" option
 * - Persists onboarding-complete flag after successful completion
 */
export function OnboardingScreen({ onComplete, authService, syncService }: OnboardingScreenProps) {
  const {
    authError,
    authFormMode,
    email,
    handleCancelSignIn,
    handleEmailAuthSubmit,
    handleGoogleSignIn,
    handleOptionClick,
    isSubmitting,
    password,
    selectAuthFormMode,
    setEmail,
    setPassword,
    showSignInForm,
    syncError,
  } = useOnboardingFlow({
    authService,
    onComplete,
    syncService,
  });

  return (
    <div className="flex h-full min-h-0 overflow-y-auto bg-[var(--color-background)] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto my-auto w-full max-w-3xl space-y-10">
        <OnboardingHero />

        <OnboardingOptionGrid
          disabled={isSubmitting}
          onSelect={handleOptionClick}
          options={ONBOARDING_OPTIONS}
        />

        {showSignInForm && (
          <OnboardingSignInCard
            authError={authError}
            authFormMode={authFormMode}
            authServiceAvailable={Boolean(authService)}
            email={email}
            isSubmitting={isSubmitting}
            onCancel={handleCancelSignIn}
            onEmailChange={setEmail}
            onGoogleSignIn={handleGoogleSignIn}
            onPasswordChange={setPassword}
            onSelectMode={selectAuthFormMode}
            onSubmit={handleEmailAuthSubmit}
            password={password}
          />
        )}

        {syncError && (
          <p role="alert" className="text-center text-xs text-red-600">
            {syncError}
          </p>
        )}

        <OnboardingBenefits benefits={ONBOARDING_BENEFITS} />
        <OnboardingPrivacyFooter />
      </div>
    </div>
  );
}
