import React, { useState, useCallback } from 'react';
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
  Chrome,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAppModeStore } from '../stores/app-mode-store';
import type { IAuthService } from '../services/interfaces';
import type { AuthError } from '../types/index';

// ─── Onboarding persistence ────────────────────────────────────────────────────

export const ONBOARDING_KEY = 'promptdock_onboarding_complete';

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface OnboardingScreenProps {
  onComplete: (choice: 'local' | 'sync' | 'signin') => void;
  authService?: IAuthService;
  syncService?: {
    transitionToSynced: (
      userId: string,
      workspaceId: string,
      localPrompts: never[],
      migrationChoice: 'fresh',
    ) => Promise<void>;
  };
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

// ─── Auth Error Messages ───────────────────────────────────────────────────────

function authErrorMessage(error: AuthError): string {
  switch (error) {
    case 'invalid-credentials':
      return 'Invalid email or password. Please try again.';
    case 'email-in-use':
      return 'An account with this email already exists.';
    case 'weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'missing-configuration':
      return 'Firebase is not configured for this build. Add the Firebase environment variables and restart PromptDock.';
    case 'network':
      return 'Network error while contacting Firebase. Check your connection and try again.';
    case 'popup-blocked':
      return 'The Google sign-in popup was blocked. Allow popups for PromptDock and try again.';
    case 'popup-cancelled':
      return 'Google sign-in was cancelled.';
    case 'unknown':
    default:
      return 'An unexpected error occurred. Please try again.';
  }
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
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);

  // Sign-in form state
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const completeAuth = useCallback(
    (result: Awaited<ReturnType<IAuthService['signIn']>>) => {
      if (result.success) {
        setUserId(result.user.uid);
        setMode('synced');
        markOnboardingComplete();
        onComplete('signin');
      } else {
        setAuthError(authErrorMessage(result.error));
      }
    },
    [setMode, setUserId, onComplete],
  );

  // ── "Start locally" handler (Task 6.1) ─────────────────────────────────────
  const handleStartLocally = useCallback(() => {
    setMode('local');
    markOnboardingComplete();
    onComplete('local');
  }, [setMode, onComplete]);

  // ── "Sign in" button handler (Task 6.2) ────────────────────────────────────
  const handleSignInClick = useCallback(() => {
    setShowSignInForm(true);
    setAuthError(null);
  }, []);

  // ── Sign-in form submission (Task 6.2) ─────────────────────────────────────
  const handleSignInSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!authService) return;
      setAuthError(null);
      setIsSubmitting(true);
      try {
        const result = await authService.signIn(email, password);
        completeAuth(result);
      } finally {
        setIsSubmitting(false);
      }
    },
    [authService, completeAuth, email, password],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (!authService) return;
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const result = await authService.signInWithGoogle();
      completeAuth(result);
    } finally {
      setIsSubmitting(false);
    }
  }, [authService, completeAuth]);

  // ── "Enable sync" handler (Task 6.3) ───────────────────────────────────────
  const handleEnableSync = useCallback(async () => {
    setSyncError(null);
    setIsSubmitting(true);
    try {
      if (syncService) {
        const guestUserId = `guest-${Date.now()}`;
        const guestWorkspaceId = `workspace-${guestUserId}`;
        setUserId(guestUserId);
        await syncService.transitionToSynced(guestUserId, guestWorkspaceId, [], 'fresh');
      } else {
        // Fallback: just set mode to synced if no sync service provided
        setMode('synced');
      }
      markOnboardingComplete();
      onComplete('sync');
    } catch (err) {
      setSyncError(
        `Failed to enable sync: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [syncService, setMode, setUserId, onComplete]);

  // ── Option click dispatcher ────────────────────────────────────────────────
  const handleOptionClick = useCallback(
    (key: 'local' | 'sync' | 'signin') => {
      switch (key) {
        case 'local':
          handleStartLocally();
          break;
        case 'signin':
          handleSignInClick();
          break;
        case 'sync':
          void handleEnableSync();
          break;
      }
    },
    [handleStartLocally, handleSignInClick, handleEnableSync],
  );

  return (
    <div className="flex h-full min-h-0 overflow-y-auto bg-[var(--color-background)] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto my-auto w-full max-w-3xl space-y-10">
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
                onClick={() => handleOptionClick(option.key)}
                disabled={isSubmitting}
                aria-label={option.title}
              >
                {option.buttonLabel}
              </Button>
            </Card>
          ))}
        </div>

        {/* ── Sign-in Form (shown when "Sign in" is clicked) ────────── */}
        {showSignInForm && (
          <Card padding="lg" className="mx-auto max-w-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-main)]">
              Sign in to your account
            </h3>
            <form onSubmit={handleSignInSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="onboarding-email"
                  className="mb-1 block text-xs font-medium text-[var(--color-text-main)]"
                >
                  Email
                </label>
                <Input
                  id="onboarding-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  aria-label="Email"
                />
              </div>
              <div>
                <label
                  htmlFor="onboarding-password"
                  className="mb-1 block text-xs font-medium text-[var(--color-text-main)]"
                >
                  Password
                </label>
                <Input
                  id="onboarding-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-label="Password"
                />
              </div>

              {authError && (
                <p role="alert" className="text-xs text-red-600">
                  {authError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowSignInForm(false);
                    setAuthError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                or
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || !authService}
              className="w-full"
              aria-label="Continue with Google"
            >
              <Chrome size={16} className="mr-2" />
              Continue with Google
            </Button>
          </Card>
        )}

        {/* ── Sync Error ────────────────────────────────────────────── */}
        {syncError && (
          <p role="alert" className="text-center text-xs text-red-600">
            {syncError}
          </p>
        )}

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
