// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { StoreApi } from 'zustand';
import type { AppModeStore } from '../../stores/app-mode-store';
import { createAppModeStore } from '../../stores/app-mode-store';
import {
  OnboardingScreen,
  ONBOARDING_KEY,
  isOnboardingComplete,
  markOnboardingComplete,
} from '../onboarding';
import type { IAuthService } from '../../services/interfaces';
import type { AuthResult } from '../../types/index';

// ─── Mock AppModeStore module ──────────────────────────────────────────────────

let testAppModeStore: StoreApi<AppModeStore>;

vi.mock('../../stores/app-mode-store', async () => {
  const actual = await vi.importActual<typeof import('../../stores/app-mode-store')>(
    '../../stores/app-mode-store',
  );
  const { useStore } = await vi.importActual<typeof import('zustand')>('zustand');
  return {
    ...actual,
    useAppModeStore: (selector?: (state: AppModeStore) => unknown) => {
      return selector ? useStore(testAppModeStore, selector) : useStore(testAppModeStore);
    },
  };
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function createMockAuthService(overrides: Partial<IAuthService> = {}): IAuthService {
  return {
    signIn: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'user-123', email: 'test@example.com', displayName: null },
    })),
    signUp: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'user-456', email: 'new@example.com', displayName: null },
    })),
    signInWithGoogle: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'google-user', email: 'google@example.com', displayName: 'Google User' },
    })),
    signOut: vi.fn(async () => {}),
    restoreSession: vi.fn(async () => null),
    sendPasswordReset: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn(() => () => {}),
    ...overrides,
  };
}

beforeEach(() => {
  testAppModeStore = createAppModeStore();
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ─── Basic rendering tests ─────────────────────────────────────────────────────

describe('OnboardingScreen', () => {
  it('renders the welcome heading', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Welcome to PromptDock')).toBeDefined();
  });

  it('uses an internal scroll container for constrained app windows', () => {
    const { container } = render(<OnboardingScreen onComplete={() => {}} />);
    const root = container.firstElementChild;

    expect(root?.className).toContain('h-full');
    expect(root?.className).toContain('min-h-0');
    expect(root?.className).toContain('overflow-y-auto');
  });

  it('renders local and sign-in option cards with CTA buttons', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Get started')).toBeDefined();
    // Each option has a heading and a button
    expect(screen.getAllByText('Start locally').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sign in').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Enable sync')).toBeNull();
  });

  it('renders 4 benefit cards with descriptions', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Store prompt recipes')).toBeDefined();
    expect(screen.getByText('Fill variables')).toBeDefined();
    expect(screen.getByText('Paste anywhere')).toBeDefined();
    expect(screen.getByText('Works offline')).toBeDefined();
    // Each benefit has a description
    expect(screen.getByText('Organize and reuse your best prompts.')).toBeDefined();
  });
});

// ─── Task 6.1: "Start locally" sets AppModeStore to local and navigates ────────

describe('OnboardingScreen — Start locally (Task 6.1)', () => {
  it('sets AppModeStore mode to local when "Start locally" is clicked', () => {
    const handleComplete = vi.fn();
    render(<OnboardingScreen onComplete={handleComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start locally' }));

    expect(testAppModeStore.getState().mode).toBe('local');
    expect(handleComplete).toHaveBeenCalledWith('local');
  });

  it('persists onboarding-complete flag when "Start locally" is clicked', () => {
    render(<OnboardingScreen onComplete={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start locally' }));

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });
});

// ─── Task 6.2: "Sign in" presents form and calls AuthService.signIn ────────────

describe('OnboardingScreen — Sign in (Task 6.2)', () => {
  it('shows sign-in form when "Sign in" button is clicked', () => {
    const authService = createMockAuthService();
    render(<OnboardingScreen onComplete={() => {}} authService={authService} />);

    // Initially no form
    expect(screen.queryByLabelText('Email')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    // Form should now be visible
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
  });

  it('disables onboarding auth before submit when Firebase is not configured', async () => {
    const authService = createMockAuthService({
      isConfigured: vi.fn(() => false),
    });
    render(<OnboardingScreen onComplete={() => {}} authService={authService} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    const googleButton = screen.getByRole('button', { name: 'Continue with Google' });

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(submitButton).toHaveProperty('disabled', true);
    expect(googleButton).toHaveProperty('disabled', true);
    expect(screen.getByText(/Firebase is not configured/)).toBeDefined();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('disables onboarding auth when no auth service is provided', () => {
    render(<OnboardingScreen onComplete={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    const googleButton = screen.getByRole('button', { name: 'Continue with Google' });

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(submitButton).toHaveProperty('disabled', true);
    expect(googleButton).toHaveProperty('disabled', true);
    expect(screen.getByText(/Firebase is not configured/)).toBeDefined();
  });

  it('calls AuthService.signIn on form submission and updates AppModeStore', async () => {
    const authService = createMockAuthService();
    const handleComplete = vi.fn();
    render(
      <OnboardingScreen onComplete={handleComplete} authService={authService} />,
    );

    // Open sign-in form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit
    const form = screen.getByLabelText('Email').closest('form')!;
    const submitButton = form.querySelector('button[type="submit"]')!;
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(testAppModeStore.getState().mode).toBe('synced');
    expect(testAppModeStore.getState().userId).toBe('user-123');
    expect(handleComplete).toHaveBeenCalledWith('signin');
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('displays auth error on sign-in failure', async () => {
    const authService = createMockAuthService({
      signIn: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'invalid-credentials',
      })),
    });
    render(<OnboardingScreen onComplete={() => {}} authService={authService} />);

    // Open sign-in form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    // Fill and submit
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    });

    const form = screen.getByLabelText('Email').closest('form')!;
    const submitButton = form.querySelector('button[type="submit"]')!;
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid email or password');
    });

    // AppModeStore should remain in local mode
    expect(testAppModeStore.getState().mode).toBe('local');
    // Onboarding flag should NOT be set
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
  });

  it('calls AuthService.signInWithGoogle and completes onboarding', async () => {
    const authService = createMockAuthService();
    const handleComplete = vi.fn();
    render(<OnboardingScreen onComplete={handleComplete} authService={authService} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    });

    expect(authService.signInWithGoogle).toHaveBeenCalled();
    expect(testAppModeStore.getState().mode).toBe('synced');
    expect(testAppModeStore.getState().userId).toBe('google-user');
    expect(handleComplete).toHaveBeenCalledWith('signin');
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('can cancel the sign-in form', () => {
    const authService = createMockAuthService();
    render(<OnboardingScreen onComplete={() => {}} authService={authService} />);

    // Open sign-in form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByLabelText('Email')).toBeDefined();

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText('Email')).toBeNull();
  });
});

// ─── Task 6.4: Persist onboarding-complete flag ────────────────────────────────

describe('Onboarding flag persistence (Task 6.4)', () => {
  it('markOnboardingComplete sets the flag in localStorage', () => {
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
    markOnboardingComplete();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('isOnboardingComplete returns false when flag is not set', () => {
    expect(isOnboardingComplete()).toBe(false);
  });

  it('isOnboardingComplete returns true when flag is set', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    expect(isOnboardingComplete()).toBe(true);
  });

  it('isOnboardingComplete returns false for non-true values', () => {
    localStorage.setItem(ONBOARDING_KEY, 'false');
    expect(isOnboardingComplete()).toBe(false);
  });

  it('each onboarding path persists the flag on success', async () => {
    // "Start locally"
    localStorage.clear();
    const { unmount: u1 } = render(<OnboardingScreen onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start locally' }));
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    u1();

    // "Sign in" (with authService)
    localStorage.clear();
    const authService = createMockAuthService();
    const { unmount: u2 } = render(
      <OnboardingScreen onComplete={() => {}} authService={authService} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'pass123' },
    });
    const form = screen.getByLabelText('Email').closest('form')!;
    const submitButton = form.querySelector('button[type="submit"]')!;
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    u2();
  });
});

// ─── Task 6.5: Check onboarding-complete flag on app start ─────────────────────

describe('Onboarding flag check on app start (Task 6.5)', () => {
  it('isOnboardingComplete is used by AppShell to skip onboarding', () => {
    // This is tested indirectly: when the flag is set, AppShell initializes
    // with screen = 'library' instead of 'onboarding'. We verify the utility
    // function works correctly here; the AppShell integration is tested in
    // AppShell tests.
    localStorage.setItem(ONBOARDING_KEY, 'true');
    expect(isOnboardingComplete()).toBe(true);

    localStorage.removeItem(ONBOARDING_KEY);
    expect(isOnboardingComplete()).toBe(false);
  });
});
