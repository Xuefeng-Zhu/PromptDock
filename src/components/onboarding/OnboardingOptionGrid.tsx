import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import type { OnboardingChoice } from '../../hooks/use-onboarding-flow';
import type { OnboardingOptionItem } from './onboarding-data';

interface OnboardingOptionGridProps {
  disabled: boolean;
  onSelect: (choice: OnboardingChoice) => void;
  options: OnboardingOptionItem[];
}

const optionTreatments: Record<
  OnboardingChoice,
  {
    buttonVariant: 'primary' | 'secondary';
    cardClassName: string;
    iconClassName: string;
    label: string;
    labelClassName: string;
  }
> = {
  local: {
    buttonVariant: 'primary',
    cardClassName:
      'border-blue-200 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.10)] dark:border-blue-800/60 dark:bg-gray-900',
    iconClassName:
      'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    label: 'Private default',
    labelClassName:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  signin: {
    buttonVariant: 'secondary',
    cardClassName:
      'border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-900',
    iconClassName:
      'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300',
    label: 'Existing account',
    labelClassName:
      'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300',
  },
};

export function OnboardingOptionGrid({
  disabled,
  onSelect,
  options,
}: OnboardingOptionGridProps) {
  return (
    <div className="min-w-0 space-y-3">
      {options.map((option) => {
        const treatment = optionTreatments[option.key];

        return (
          <div
            key={option.key}
            className={[
              'min-w-0 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
              treatment.cardClassName,
            ].join(' ')}
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className={[
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  treatment.iconClassName,
                ].join(' ')}
              >
                {option.icon}
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
                    {option.title}
                  </h3>
                  <span
                    className={[
                      'rounded-md px-2 py-0.5 text-[11px] font-medium',
                      treatment.labelClassName,
                    ].join(' ')}
                  >
                    {treatment.label}
                  </span>
                </div>
                <p className="mt-1.5 break-words text-xs leading-6 text-[var(--color-text-muted)]">
                  {option.description}
                </p>
              </div>

              <Button
                variant={treatment.buttonVariant}
                size="sm"
                className="h-10 w-full gap-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 sm:w-36"
                onClick={() => onSelect(option.key)}
                disabled={disabled}
                aria-label={option.title}
              >
                <span>{option.buttonLabel}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
