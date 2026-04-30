import React from 'react';
import {
  Terminal,
  Monitor,
  Cloud,
  UserCircle,
  FileText,
  Braces,
  ClipboardCopy,
  WifiOff,
  Lock,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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
  buttonLabel: string;
}

const OPTIONS: OptionItem[] = [
  {
    key: 'local',
    icon: <Monitor size={28} />,
    title: 'Start locally',
    description:
      'Keep everything on this device. Your prompts stay private and never leave your computer.',
    buttonLabel: 'Start locally',
  },
  {
    key: 'sync',
    icon: <Cloud size={28} />,
    title: 'Enable sync',
    description:
      'Use a guest cloud account to sync your prompts. Add email later, anytime.',
    buttonLabel: 'Enable sync',
  },
  {
    key: 'signin',
    icon: <UserCircle size={28} />,
    title: 'Sign in',
    description:
      'Sign in to your account to sync across devices and access everywhere.',
    buttonLabel: 'Sign in',
  },
];

// ─── Benefit Card Data ─────────────────────────────────────────────────────────

interface BenefitItem {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: <FileText size={24} />,
    iconColor: 'text-[var(--color-primary)]',
    title: 'Store prompt recipes',
    description: 'Organize and reuse your best prompts.',
  },
  {
    icon: <Braces size={24} />,
    iconColor: 'text-amber-600',
    title: 'Fill variables',
    description: 'Use variables to adapt prompts in seconds.',
  },
  {
    icon: <ClipboardCopy size={24} />,
    iconColor: 'text-green-600',
    title: 'Paste anywhere',
    description: 'Copy with one click and use in any app.',
  },
  {
    icon: <WifiOff size={24} />,
    iconColor: 'text-rose-500',
    title: 'Works offline',
    description: 'Access your prompts even without internet.',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * First-run onboarding screen matching the high-fidelity mockup.
 * Displays a welcome header, 3-column option cards with CTA buttons,
 * 4-column benefit cards with descriptions, and a privacy footer.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] p-8">
      <div className="w-full max-w-3xl space-y-10">
        {/* ── Welcome Header ────────────────────────────────────────── */}
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

        {/* ── Get Started Section ───────────────────────────────────── */}
        <div className="text-center">
          <h2 className="text-base font-semibold text-[var(--color-text-main)]">
            Get started
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Choose how you'd like to use PromptDock
          </p>
        </div>

        {/* ── Option Cards (3-column) ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPTIONS.map((option) => (
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
                onClick={() => onComplete(option.key)}
                aria-label={option.title}
              >
                {option.buttonLabel}
              </Button>
            </Card>
          ))}
        </div>

        {/* ── Benefit Cards (4-column) ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BENEFITS.map((benefit) => (
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

        {/* ── Footer ────────────────────────────────────────────────── */}
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Lock size={12} />
          Private by design. You're in control.
        </p>
      </div>
    </div>
  );
}
