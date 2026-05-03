import { Lock, Terminal } from 'lucide-react';

export function OnboardingHero() {
  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]">
          <Terminal size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
          Welcome to PromptDock
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          Your prompt recipe manager
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-base font-semibold text-[var(--color-text-main)]">
          Get started
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Choose how you'd like to use PromptDock
        </p>
      </div>
    </>
  );
}

export function OnboardingPrivacyFooter() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
      <Lock size={12} />
      Private by design. You're in control.
    </p>
  );
}
