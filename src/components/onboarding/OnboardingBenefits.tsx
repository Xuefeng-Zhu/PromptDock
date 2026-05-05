import type { OnboardingBenefitItem } from './onboarding-data';

interface OnboardingBenefitsProps {
  benefits: OnboardingBenefitItem[];
}

export function OnboardingBenefits({ benefits }: OnboardingBenefitsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {benefits.map((benefit) => (
        <div
          key={benefit.title}
          className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 shadow-sm"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-800 ${benefit.iconColor}`}
          >
            {benefit.icon}
          </span>
          <div className="min-w-0 text-left">
            <h4 className="text-xs font-semibold text-[var(--color-text-main)]">
              {benefit.title}
            </h4>
            <p className="mt-1 break-words text-[11px] leading-5 text-[var(--color-text-muted)]">
              {benefit.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
