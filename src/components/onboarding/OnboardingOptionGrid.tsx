import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { OnboardingChoice } from '../../hooks/use-onboarding-flow';
import type { OnboardingOptionItem } from './onboarding-data';

interface OnboardingOptionGridProps {
  disabled: boolean;
  onSelect: (choice: OnboardingChoice) => void;
  options: OnboardingOptionItem[];
}

export function OnboardingOptionGrid({
  disabled,
  onSelect,
  options,
}: OnboardingOptionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((option) => (
        <Card key={option.key} padding="lg" className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-light)]">
            <span className="text-[var(--color-primary)]">{option.icon}</span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
            {option.title}
          </h3>
          <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {option.description}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-5 w-full"
            onClick={() => onSelect(option.key)}
            disabled={disabled}
            aria-label={option.title}
          >
            {option.buttonLabel}
          </Button>
        </Card>
      ))}
    </div>
  );
}
