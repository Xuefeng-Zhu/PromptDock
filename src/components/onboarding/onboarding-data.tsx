import {
  Braces,
  ClipboardCopy,
  Cloud,
  FileText,
  Monitor,
  UserCircle,
  WifiOff,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { OnboardingChoice } from '../../hooks/use-onboarding-flow';

export interface OnboardingOptionItem {
  key: OnboardingChoice;
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
}

export interface OnboardingBenefitItem {
  icon: ReactNode;
  iconColor: string;
  title: string;
  description: string;
}

export const ONBOARDING_OPTIONS: OnboardingOptionItem[] = [
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

export const ONBOARDING_BENEFITS: OnboardingBenefitItem[] = [
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
