import { Card } from '../ui/Card';
import type { OnboardingBenefitItem } from './onboarding-data';

interface OnboardingBenefitsProps {
  benefits: OnboardingBenefitItem[];
}

export function OnboardingBenefits({ benefits }: OnboardingBenefitsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {benefits.map((benefit) => (
        <Card key={benefit.title} padding="md" className="flex flex-col items-start">
          <span className={`mb-3 ${benefit.iconColor}`}>{benefit.icon}</span>
          <h4 className="text-xs font-semibold text-[var(--color-text-main)]">
            {benefit.title}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {benefit.description}
          </p>
        </Card>
      ))}
    </div>
  );
}
