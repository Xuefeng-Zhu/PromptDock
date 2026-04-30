import React from 'react';
import {
  Rocket,
  HardDrive,
  Cloud,
  LogIn,
  BookOpen,
  Variable,
  ClipboardPaste,
  WifiOff,
} from 'lucide-react';
import { Card } from './ui/Card';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface OnboardingScreenProps {
  onComplete: (choice: 'local' | 'sync' | 'signin') => void;
}

// ─── Option Card Data ──────────────────────────────────────────────────────────

interface OptionItem {
  key: 'local' | 'sync' | 'signin';
  icon: React.ReactNode;
  title: string;
  description: string;
}

const OPTIONS: OptionItem[] = [
  {
    key: 'local',
    icon: <HardDrive size={24} />,
    title: 'Start locally',
    description: 'Keep everything on this device. No account needed.',
  },
  {
    key: 'sync',
    icon: <Cloud size={24} />,
    title: 'Enable sync',
    description: 'Sync prompts across devices with cloud storage.',
  },
  {
    key: 'signin',
    icon: <LogIn size={24} />,
    title: 'Sign in',
    description: 'Already have an account? Pick up where you left off.',
  },
];

// ─── Benefit Card Data ─────────────────────────────────────────────────────────

interface BenefitItem {
  icon: React.ReactNode;
  title: string;
}

const BENEFITS: BenefitItem[] = [
  { icon: <BookOpen size={20} />, title: 'Store prompt recipes' },
  { icon: <Variable size={20} />, title: 'Fill variables' },
  { icon: <ClipboardPaste size={20} />, title: 'Paste anywhere' },
  { icon: <WifiOff size={20} />, title: 'Works offline' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * First-run onboarding screen. Displays a welcome card with the PromptDock
 * logo, three setup option cards, four benefit cards, and a privacy footer.
 * All option cards call `onComplete` with the chosen mode.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] p-8">
      <div className="w-full max-w-xl space-y-8">
        {/* ── Welcome Card ──────────────────────────────────────────── */}
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-light)]">
            <Rocket size={28} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Welcome to PromptDock
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Your personal prompt recipe manager. Choose how to get started.
          </p>
        </Card>

        {/* ── Option Cards ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded-xl"
              onClick={() => onComplete(option.key)}
              aria-label={option.title}
            >
              <Card
                padding="md"
                className="flex items-center gap-4 transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)]">
                  <span className="text-[var(--color-primary)]">
                    {option.icon}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    {option.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {option.description}
                  </p>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* ── Benefit Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((benefit) => (
            <Card
              key={benefit.title}
              padding="sm"
              className="flex items-center gap-3"
            >
              <span className="text-[var(--color-primary)]">
                {benefit.icon}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-main)]">
                {benefit.title}
              </span>
            </Card>
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Private by design. You're in control.
        </p>
      </div>
    </div>
  );
}
