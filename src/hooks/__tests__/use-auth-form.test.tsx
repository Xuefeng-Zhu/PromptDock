// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResult, AuthUser } from '../../types/index';
import type { IAuthService } from '../../services/interfaces';
import { useAuthForm } from '../use-auth-form';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    uid: 'user-1',
    email: 'user@example.com',
    displayName: 'User Example',
    ...overrides,
  };
}

function makeAuthService(overrides: Partial<IAuthService> = {}): IAuthService {
  return {
    signUp: vi.fn(async (): Promise<AuthResult> => ({ success: true, user: makeUser({ uid: 'new-user' }) })),
    signIn: vi.fn(async (): Promise<AuthResult> => ({ success: true, user: makeUser() })),
    signInWithGoogle: vi.fn(async (): Promise<AuthResult> => ({ success: true, user: makeUser({ uid: 'google-user' }) })),
    signOut: vi.fn(async () => {}),
    restoreSession: vi.fn(async () => null),
    sendPasswordReset: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn(() => () => {}),
    ...overrides,
  };
}

function formEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

describe('useAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in with email credentials and resets form state after success', async () => {
    const authService = makeAuthService();
    const onAuthSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ authService, onAuthSuccess }),
    );

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('secret');
    });

    await act(async () => {
      await result.current.handleEmailAuthSubmit(formEvent());
    });

    expect(authService.signIn).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(onAuthSuccess).toHaveBeenCalledWith(makeUser());
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.authError).toBeNull();
  });

  it('switches to sign-up mode and calls signUp', async () => {
    const authService = makeAuthService();
    const onAuthSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ authService, onAuthSuccess }),
    );

    act(() => {
      result.current.selectAuthFormMode('sign-up');
      result.current.setEmail('new@example.com');
      result.current.setPassword('strong-password');
    });

    await act(async () => {
      await result.current.handleEmailAuthSubmit(formEvent());
    });

    expect(authService.signUp).toHaveBeenCalledWith('new@example.com', 'strong-password');
    expect(onAuthSuccess).toHaveBeenCalledWith(makeUser({ uid: 'new-user' }));
  });

  it('maps auth errors and clears them when switching modes', async () => {
    const authService = makeAuthService({
      signIn: vi.fn(async (): Promise<AuthResult> => ({ success: false, error: 'invalid-credentials' })),
    });
    const { result } = renderHook(() =>
      useAuthForm({ authService, onAuthSuccess: vi.fn() }),
    );

    await act(async () => {
      await result.current.handleEmailAuthSubmit(formEvent());
    });

    expect(result.current.authError).toContain('Invalid email or password');

    act(() => {
      result.current.selectAuthFormMode('sign-up');
    });

    expect(result.current.authError).toBeNull();
  });

  it('reports unavailable auth services and signs out through the service when present', async () => {
    const unavailable = renderHook(() => useAuthForm({ onAuthSuccess: vi.fn() }));

    await act(async () => {
      await unavailable.result.current.handleEmailAuthSubmit(formEvent());
    });

    expect(unavailable.result.current.authError).toContain('Firebase is not configured');

    const authService = makeAuthService();
    const onSignOutSuccess = vi.fn();
    const available = renderHook(() =>
      useAuthForm({
        authService,
        onAuthSuccess: vi.fn(),
        onSignOutSuccess,
      }),
    );

    act(() => {
      available.result.current.setAuthUser(makeUser());
    });

    await act(async () => {
      await available.result.current.handleSignOut();
    });

    expect(authService.signOut).toHaveBeenCalledTimes(1);
    expect(onSignOutSuccess).toHaveBeenCalledTimes(1);
    expect(available.result.current.authUser).toBeNull();
  });

  it('does not submit when the auth service reports missing configuration', async () => {
    const authService = makeAuthService({
      isConfigured: vi.fn(() => false),
    });
    const { result } = renderHook(() =>
      useAuthForm({ authService, onAuthSuccess: vi.fn() }),
    );

    expect(result.current.authServiceAvailable).toBe(false);

    await act(async () => {
      await result.current.handleEmailAuthSubmit(formEvent());
    });

    expect(authService.signIn).not.toHaveBeenCalled();
    expect(result.current.authError).toContain('Firebase is not configured');
  });
});
