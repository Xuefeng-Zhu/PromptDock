// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopBar } from '../top-bar';
import type { IAuthService } from '../../services/interfaces';
import type { AuthResult } from '../../types/index';

const defaultProps = {
  onCommandPaletteOpen: vi.fn(),
};

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

describe('TopBar', () => {
  it('renders "PromptDock" title', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('PromptDock')).toBeDefined();
  });

  it('renders command palette trigger with search text', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Open command palette' })).toBeDefined();
    expect(screen.getByText('Search prompts')).toBeDefined();
  });

  it('renders command palette keyboard shortcut metadata', () => {
    render(<TopBar {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: 'Open command palette' });
    expect(trigger.getAttribute('aria-keyshortcuts')).toBe('Meta+K Control+K');
  });

  it('renders ⌘K shortcut hint', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('⌘K')).toBeDefined();
  });

  it('renders account icon button with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const accountBtn = screen.getByRole('button', { name: 'Account' });
    expect(accountBtn).toBeDefined();
  });

  it('opens a signed-out account form in the dropdown', () => {
    render(<TopBar {...defaultProps} authService={createMockAuthService()} syncStatus="local" />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByRole('dialog', { name: 'Account' })).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in to account' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDefined();
  });

  it('submits sign-in from the account dropdown', async () => {
    const authService = createMockAuthService();
    const onAuthSuccess = vi.fn();
    render(<TopBar {...defaultProps} authService={authService} onAuthSuccess={onAuthSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to account' }));

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    await waitFor(() => {
      expect(onAuthSuccess).toHaveBeenCalledWith({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: null,
      });
    });
  });

  it('switches the account dropdown to sign-up mode', () => {
    render(<TopBar {...defaultProps} authService={createMockAuthService()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
  });

  it('shows signed-in account info and signs out from the dropdown', async () => {
    const authService = createMockAuthService({
      onAuthStateChanged: vi.fn((callback) => {
        callback({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });
        return () => {};
      }),
    });
    const onSignOutSuccess = vi.fn();

    render(
      <TopBar
        {...defaultProps}
        authService={authService}
        mode="synced"
        userId="user-123"
        syncStatus="synced"
        onSignOutSuccess={onSignOutSuccess}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(authService.signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onSignOutSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the account dropdown with Escape', () => {
    render(<TopBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByRole('dialog', { name: 'Account' })).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Account' })).toBeNull();
  });

  it('calls onCommandPaletteOpen when clicking the command palette trigger', () => {
    const onCommandPaletteOpen = vi.fn();
    render(<TopBar {...defaultProps} onCommandPaletteOpen={onCommandPaletteOpen} />);
    const trigger = screen.getByRole('button', { name: 'Open command palette' });
    fireEvent.click(trigger);
    expect(onCommandPaletteOpen).toHaveBeenCalledTimes(1);
  });

  it('renders as a header element', () => {
    const { container } = render(<TopBar {...defaultProps} />);
    expect(container.querySelector('header')).toBeDefined();
  });
});
