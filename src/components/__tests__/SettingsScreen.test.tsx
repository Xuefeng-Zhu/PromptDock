// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { StoreApi } from 'zustand';
import type { UserSettings, PromptRecipe } from '../../types/index';
import type { ISettingsRepository, IPromptRepository } from '../../repositories/interfaces';
import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  type SettingsStore,
} from '../../stores/settings-store';
import {
  createAppModeStore,
  type AppModeStore,
} from '../../stores/app-mode-store';
import {
  createPromptStore,
  type PromptStore,
} from '../../stores/prompt-store';
import { SettingsScreen } from '../SettingsScreen';

// ─── Mock SettingsStore module ─────────────────────────────────────────────────
// We mock the useSettingsStore hook so the component reads from our test store.

let testStore: StoreApi<SettingsStore>;
let testAppModeStore: StoreApi<AppModeStore>;
let testPromptStore: StoreApi<PromptStore>;
let mockRepo: ISettingsRepository;
let mockPromptRepo: IPromptRepository;

function createMockRepo(
  initial: UserSettings = { ...DEFAULT_SETTINGS },
): ISettingsRepository {
  let settings = { ...initial };
  return {
    get: vi.fn(async () => ({ ...settings })),
    update: vi.fn(async (changes: Partial<UserSettings>) => {
      settings = { ...settings, ...changes };
      return { ...settings };
    }),
  };
}

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: crypto.randomUUID(),
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello {{name}}!',
    tags: ['test'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function createMockPromptRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
  const prompts = [...initialPrompts];
  return {
    getAll: vi.fn(async () => prompts.map((p) => ({ ...p }))),
    create: vi.fn(async (data) => {
      const created: PromptRecipe = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PromptRecipe;
      prompts.push(created);
      return created;
    }),
    update: vi.fn(async (id, changes) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Prompt not found: ${id}`);
      const updated = { ...prompts[idx], ...changes, updatedAt: new Date() };
      prompts[idx] = updated;
      return updated;
    }),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => {
      const original = prompts.find((p) => p.id === id);
      if (!original) throw new Error(`Prompt not found: ${id}`);
      const dup: PromptRecipe = {
        ...original,
        id: crypto.randomUUID(),
        title: `Copy of ${original.title}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prompts.push(dup);
      return dup;
    }),
    toggleFavorite: vi.fn(async (id) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Prompt not found: ${id}`);
      prompts[idx] = { ...prompts[idx], favorite: !prompts[idx].favorite };
      return prompts[idx];
    }),
    getById: vi.fn(async (id) => prompts.find((p) => p.id === id) ?? null),
  };
}

vi.mock('../../stores/settings-store', async () => {
  const actual = await vi.importActual<typeof import('../../stores/settings-store')>(
    '../../stores/settings-store',
  );
  return {
    ...actual,
    useSettingsStore: (selector?: (state: SettingsStore) => unknown) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useStore } = require('zustand');
      return selector ? useStore(testStore, selector) : useStore(testStore);
    },
  };
});

vi.mock('../../stores/app-mode-store', async () => {
  const actual = await vi.importActual<typeof import('../../stores/app-mode-store')>(
    '../../stores/app-mode-store',
  );
  return {
    ...actual,
    useAppModeStore: (selector?: (state: AppModeStore) => unknown) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useStore } = require('zustand');
      return selector ? useStore(testAppModeStore, selector) : useStore(testAppModeStore);
    },
  };
});

vi.mock('../../stores/prompt-store', async () => {
  const actual = await vi.importActual<typeof import('../../stores/prompt-store')>(
    '../../stores/prompt-store',
  );
  return {
    ...actual,
    usePromptStore: (selector?: (state: PromptStore) => unknown) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useStore } = require('zustand');
      return selector ? useStore(testPromptStore, selector) : useStore(testPromptStore);
    },
  };
});

// ─── Mock registerHotkey ───────────────────────────────────────────────────────

const mockRegisterHotkey = vi.fn();

vi.mock('../../utils/hotkey', () => ({
  registerHotkey: (...args: unknown[]) => mockRegisterHotkey(...args),
}));

// ─── Mock Tauri dialog/fs modules (dynamic imports in SettingsScreen) ──────────

const mockSaveFile = vi.fn(
  async (_content: string, _defaultName: string): Promise<boolean> => true,
);
const mockOpenFile = vi.fn(async (): Promise<string | null> => null);

vi.mock('../../utils/file-dialog', () => ({
  saveFile: (content: string, defaultName: string) => mockSaveFile(content, defaultName),
  openFile: () => mockOpenFile(),
}));

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  mockRepo = createMockRepo();
  testStore = createSettingsStore(mockRepo);
  testAppModeStore = createAppModeStore();
  mockPromptRepo = createMockPromptRepo();
  testPromptStore = createPromptStore(mockPromptRepo);
  mockRegisterHotkey.mockResolvedValue(undefined);
  mockSaveFile.mockResolvedValue(true);
  mockOpenFile.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Basic rendering tests ─────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  it('renders the Settings heading and Back button', () => {
    render(<SettingsScreen onBack={() => {}} />);
    expect(screen.getByText('Settings')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeDefined();
  });

  it('renders all navigation sections in the nav', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    expect(nav.textContent).toContain('Account & Sync');
    expect(nav.textContent).toContain('Appearance');
    expect(nav.textContent).toContain('Hotkey');
    expect(nav.textContent).toContain('Default Behavior');
    expect(nav.textContent).toContain('Import/Export');
    expect(nav.textContent).toContain('About');
  });

  it('renders setting cards for Account, Sync, Appearance, Hotkey, Import/Export, About', () => {
    render(<SettingsScreen onBack={() => {}} />);
    // In local mode (not signed in), the Account card shows a sign-in form
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByText('Sync off')).toBeDefined();
    expect(screen.getByText('Guest cloud')).toBeDefined();
    expect(screen.getByText('Signed in')).toBeDefined();
    expect(screen.getByText('Light')).toBeDefined();
    expect(screen.getByText('Dark')).toBeDefined();
    expect(screen.getByText('System')).toBeDefined();
    expect(screen.getByText('PromptDock')).toBeDefined();
    expect(screen.getByText('v1.0.0')).toBeDefined();
  });

  it('calls onBack when the Back button is clicked', () => {
    const handleBack = vi.fn();
    render(<SettingsScreen onBack={handleBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('highlights the active nav section on click', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    const navButtons = nav.querySelectorAll('button');
    const aboutNavButton = Array.from(navButtons).find(btn => btn.textContent?.includes('About'));
    expect(aboutNavButton).toBeDefined();
    fireEvent.click(aboutNavButton!);
    expect(aboutNavButton!.getAttribute('aria-selected')).toBe('true');
  });

  it('scrolls the settings content pane when a nav section is clicked', () => {
    const scrollToSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo');
    render(<SettingsScreen onBack={() => {}} />);

    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    const aboutNavButton = Array.from(nav.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('About'),
    );

    fireEvent.click(aboutNavButton!);

    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('keeps settings content in a dedicated scroll pane', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const scrollPane = screen.getByTestId('settings-scroll-pane');

    expect(scrollPane.className).toContain('min-h-0');
    expect(scrollPane.className).toContain('overflow-y-scroll');
  });
});

// ─── Integration tests: SettingsScreen reads from and writes to SettingsStore ──

describe('SettingsScreen + SettingsStore integration', () => {
  it('reads theme from SettingsStore and displays the correct active theme', () => {
    // Default theme is 'system'
    render(<SettingsScreen onBack={() => {}} />);
    const systemRadio = screen.getByRole('radio', { name: 'System' }) as HTMLInputElement;
    expect(systemRadio.checked).toBe(true);
  });

  it('reads hotkeyCombo from SettingsStore and displays it', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const hotkeyInput = screen.getByLabelText('Global hotkey combination') as HTMLInputElement;
    expect(hotkeyInput.value).toBe('CommandOrControl+Shift+P');
  });

  it('reads defaultAction from SettingsStore and displays the correct active option', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const copyRadio = screen.getByRole('radio', { name: /Copy to Clipboard/i }) as HTMLInputElement;
    expect(copyRadio.checked).toBe(true);
  });

  it('calls updateSettings({ theme }) when theme is changed', async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const darkRadio = screen.getByRole('radio', { name: 'Dark' });

    await act(async () => {
      fireEvent.click(darkRadio);
    });

    expect(mockRepo.update).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('calls updateSettings({ defaultAction }) when default action is changed', async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const pasteRadio = screen.getByRole('radio', { name: /Paste into Active App/i });

    await act(async () => {
      fireEvent.click(pasteRadio);
    });

    expect(mockRepo.update).toHaveBeenCalledWith({ defaultAction: 'paste' });
  });

  it('calls updateSettings({ hotkeyCombo }) when hotkey Clear button is clicked', async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const clearButton = screen.getByRole('button', { name: 'Clear hotkey' });

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(mockRepo.update).toHaveBeenCalledWith({ hotkeyCombo: '' });
  });

  it('reflects updated theme from store after change', async () => {
    render(<SettingsScreen onBack={() => {}} />);

    // Change theme to dark via the store
    await act(async () => {
      await testStore.getState().updateSettings({ theme: 'dark' });
    });

    const darkRadio = screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement;
    expect(darkRadio.checked).toBe(true);
  });

  it('reflects updated defaultAction from store after change', async () => {
    render(<SettingsScreen onBack={() => {}} />);

    await act(async () => {
      await testStore.getState().updateSettings({ defaultAction: 'paste' });
    });

    const pasteRadio = screen.getByRole('radio', { name: /Paste into Active App/i }) as HTMLInputElement;
    expect(pasteRadio.checked).toBe(true);
  });

  it('reflects updated hotkeyCombo from store after change', async () => {
    render(<SettingsScreen onBack={() => {}} />);

    await act(async () => {
      await testStore.getState().updateSettings({ hotkeyCombo: 'Alt+Space' });
    });

    const hotkeyInput = screen.getByLabelText('Global hotkey combination') as HTMLInputElement;
    expect(hotkeyInput.value).toBe('Alt+Space');
  });

  it('reads custom initial settings from store', async () => {
    const customSettings: UserSettings = {
      hotkeyCombo: 'Ctrl+K',
      theme: 'light',
      defaultAction: 'paste',
      activeWorkspaceId: 'local',
    };
    mockRepo = createMockRepo(customSettings);
    testStore = createSettingsStore(mockRepo);

    await act(async () => {
      await testStore.getState().loadSettings();
    });

    render(<SettingsScreen onBack={() => {}} />);

    const lightRadio = screen.getByRole('radio', { name: 'Light' }) as HTMLInputElement;
    expect(lightRadio.checked).toBe(true);

    const pasteRadio = screen.getByRole('radio', { name: /Paste into Active App/i }) as HTMLInputElement;
    expect(pasteRadio.checked).toBe(true);

    const hotkeyInput = screen.getByLabelText('Global hotkey combination') as HTMLInputElement;
    expect(hotkeyInput.value).toBe('Ctrl+K');
  });
});

// ─── Hotkey registration integration tests ─────────────────────────────────────

describe('SettingsScreen + hotkey registration', () => {
  it('calls registerHotkey when the hotkey Clear button is clicked (empty combo)', async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const clearButton = screen.getByRole('button', { name: 'Clear hotkey' });

    await act(async () => {
      fireEvent.click(clearButton);
    });

    // SettingsScreen still delegates the empty combo so the utility can
    // unregister the native shortcut in Tauri.
    expect(mockRegisterHotkey).toHaveBeenCalledWith('');
  });

  it('captures hotkeys using Tauri-compatible modifier names', async () => {
    render(<SettingsScreen onBack={() => {}} />);
    const hotkeyInput = screen.getByLabelText('Global hotkey combination');

    await act(async () => {
      fireEvent.focus(hotkeyInput);
    });

    await waitFor(() => {
      expect((hotkeyInput as HTMLInputElement).value).toBe('Press a key combination…');
    });

    await act(async () => {
      fireEvent.keyDown(hotkeyInput, {
        key: 'p',
        metaKey: true,
        shiftKey: true,
      });
    });

    await waitFor(() => {
      expect(mockRegisterHotkey).toHaveBeenCalledWith('CommandOrControl+Shift+P');
    });
    expect(mockRepo.update).toHaveBeenCalledWith({
      hotkeyCombo: 'CommandOrControl+Shift+P',
    });
  });

  it('does not display an error when registerHotkey succeeds', async () => {
    mockRegisterHotkey.mockResolvedValueOnce(undefined);
    render(<SettingsScreen onBack={() => {}} />);
    const clearButton = screen.getByRole('button', { name: 'Clear hotkey' });

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('displays an error message when registerHotkey fails', async () => {
    mockRegisterHotkey.mockRejectedValueOnce(new Error('Hotkey already in use'));
    render(<SettingsScreen onBack={() => {}} />);

    // Simulate a hotkey change by clicking Clear (which calls handleHotkeyChange(''))
    const clearButton = screen.getByRole('button', { name: 'Clear hotkey' });

    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Failed to register hotkey');
      expect(alert.textContent).toContain('Hotkey already in use');
    });
    expect(mockRepo.update).not.toHaveBeenCalledWith({ hotkeyCombo: '' });
  });

  it('clears the error when a subsequent hotkey change succeeds', async () => {
    // First call fails
    mockRegisterHotkey.mockRejectedValueOnce(new Error('Hotkey conflict'));
    render(<SettingsScreen onBack={() => {}} />);

    const clearButton = screen.getByRole('button', { name: 'Clear hotkey' });

    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });

    // Second call succeeds
    mockRegisterHotkey.mockResolvedValueOnce(undefined);

    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});

// ─── Auth integration tests (Task 5) ───────────────────────────────────────────

import type { IAuthService } from '../../services/interfaces';
import type { AuthResult } from '../../types/index';

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
    signOut: vi.fn(async () => {}),
    restoreSession: vi.fn(async () => null),
    sendPasswordReset: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn(() => () => {}),
    ...overrides,
  };
}

describe('SettingsScreen + AuthService integration', () => {
  it('shows sign-in form with email and password fields when not authenticated', () => {
    const authService = createMockAuthService();
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    // The form has a submit button
    const form = screen.getByLabelText('Email').closest('form');
    expect(form).not.toBeNull();
    const submitBtn = form!.querySelector('button[type="submit"]');
    expect(submitBtn).not.toBeNull();
    expect(submitBtn!.textContent).toContain('Sign In');
  });

  it('shows Sign In and Sign Up tab toggles', () => {
    const authService = createMockAuthService();
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Tab toggles are plain buttons (not submit buttons)
    const accountSection = screen.getByLabelText('Account and Sync settings');
    const tabButtons = accountSection.querySelectorAll('button[type="button"]');
    const tabTexts = Array.from(tabButtons).map(b => b.textContent);
    expect(tabTexts).toContain('Sign In');
    expect(tabTexts).toContain('Sign Up');
  });

  it('calls AuthService.signIn on sign-in form submission and updates AppModeStore', async () => {
    const authService = createMockAuthService();
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    // Submit via the form submit button (type="submit")
    const form = screen.getByLabelText('Email').closest('form')!;
    const submitButton = form.querySelector('button[type="submit"]')!;
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');

    // AppModeStore should be updated to synced mode with user ID
    expect(testAppModeStore.getState().mode).toBe('synced');
    expect(testAppModeStore.getState().userId).toBe('user-123');
  });

  it('calls AuthService.signUp on sign-up form submission and updates AppModeStore', async () => {
    const authService = createMockAuthService();
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Switch to sign-up mode
    fireEvent.click(screen.getByText('Sign Up'));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpass123' } });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    });

    expect(authService.signUp).toHaveBeenCalledWith('new@example.com', 'newpass123');

    // AppModeStore should be updated to synced mode with user ID
    expect(testAppModeStore.getState().mode).toBe('synced');
    expect(testAppModeStore.getState().userId).toBe('user-456');
  });

  it('displays error message for invalid-credentials on sign-in failure', async () => {
    const authService = createMockAuthService({
      signIn: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'invalid-credentials',
      })),
    });
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });

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
  });

  it('displays error message for email-in-use on sign-up failure', async () => {
    const authService = createMockAuthService({
      signUp: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'email-in-use',
      })),
    });
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Switch to sign-up mode
    fireEvent.click(screen.getByText('Sign Up'));

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('already exists');
    });
  });

  it('displays error message for weak-password on sign-up failure', async () => {
    const authService = createMockAuthService({
      signUp: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'weak-password',
      })),
    });
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Switch to sign-up mode
    fireEvent.click(screen.getByText('Sign Up'));

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('too weak');
    });
  });

  it('shows Sign Out button when user is signed in and calls signOut on click', async () => {
    const authService = createMockAuthService();

    // Set AppModeStore to synced mode with a user
    testAppModeStore.getState().setUserId('user-123');
    testAppModeStore.getState().setMode('synced');

    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Should show Sign Out button instead of sign-in form
    const signOutButton = screen.getByRole('button', { name: 'Sign out' });
    expect(signOutButton).toBeDefined();

    await act(async () => {
      fireEvent.click(signOutButton);
    });

    expect(authService.signOut).toHaveBeenCalled();

    // AppModeStore should transition back to local mode
    expect(testAppModeStore.getState().mode).toBe('local');
    expect(testAppModeStore.getState().userId).toBeNull();
  });

  it('clears auth error when switching between sign-in and sign-up tabs', async () => {
    const authService = createMockAuthService({
      signIn: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'invalid-credentials',
      })),
    });
    render(<SettingsScreen onBack={() => {}} authService={authService} />);

    // Trigger an error
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });

    const form = screen.getByLabelText('Email').closest('form')!;
    const submitButton = form.querySelector('button[type="submit"]')!;
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });

    // Switch to sign-up tab — error should clear
    fireEvent.click(screen.getByText('Sign Up'));

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows signed-in state with Synced badge when in synced mode', () => {
    testAppModeStore.getState().setUserId('user-123');
    testAppModeStore.getState().setMode('synced');

    render(<SettingsScreen onBack={() => {}} />);

    // The AccountCard should show "Synced" badge and a Sign Out button
    expect(screen.getByText('Synced')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDefined();
  });
});

// ─── Session restore integration test ──────────────────────────────────────────

describe('Session restore (App.tsx integration)', () => {
  it('restoreSession updates AppModeStore when valid user exists', async () => {
    // This tests the logic that App.tsx performs during initialization.
    // We simulate the restoreSession flow directly against the store.
    const authService = createMockAuthService({
      restoreSession: vi.fn(async (): Promise<AuthResult> => ({
        success: true,
        user: { uid: 'restored-user', email: 'restored@example.com', displayName: 'Restored' },
      })),
    });

    const result = await authService.restoreSession();
    if (result && result.success) {
      testAppModeStore.getState().setUserId(result.user.uid);
      testAppModeStore.getState().setMode('synced');
    }

    expect(testAppModeStore.getState().mode).toBe('synced');
    expect(testAppModeStore.getState().userId).toBe('restored-user');
  });

  it('restoreSession leaves AppModeStore in local mode when no session exists', async () => {
    const authService = createMockAuthService({
      restoreSession: vi.fn(async () => null),
    });

    const result = await authService.restoreSession();
    if (result && result.success) {
      testAppModeStore.getState().setUserId(result.user.uid);
      testAppModeStore.getState().setMode('synced');
    }

    expect(testAppModeStore.getState().mode).toBe('local');
    expect(testAppModeStore.getState().userId).toBeNull();
  });

  it('restoreSession leaves AppModeStore in local mode when restoreSession fails', async () => {
    const authService = createMockAuthService({
      restoreSession: vi.fn(async (): Promise<AuthResult> => ({
        success: false,
        error: 'unknown',
      })),
    });

    const result = await authService.restoreSession();
    if (result && result.success) {
      testAppModeStore.getState().setUserId(result.user.uid);
      testAppModeStore.getState().setMode('synced');
    }

    expect(testAppModeStore.getState().mode).toBe('local');
    expect(testAppModeStore.getState().userId).toBeNull();
  });
});


// ─── Import/Export integration tests (Task 9) ──────────────────────────────────

describe('SettingsScreen + ImportExport integration', () => {
  it('renders Export and Import buttons in the Import/Export section', () => {
    render(<SettingsScreen onBack={() => {}} />);
    expect(screen.getByRole('button', { name: 'Export prompts to JSON file' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Import prompts from JSON file' })).toBeDefined();
  });

  it('Export button calls exportToJSON with prompts from PromptStore and triggers file save', async () => {
    // Seed prompts into the store
    const p1 = makePrompt({ title: 'Prompt A', body: 'Body A' });
    const p2 = makePrompt({ title: 'Prompt B', body: 'Body B' });
    mockPromptRepo = createMockPromptRepo([p1, p2]);
    testPromptStore = createPromptStore(mockPromptRepo);
    await testPromptStore.getState().loadPrompts();

    render(<SettingsScreen onBack={() => {}} />);
    const exportBtn = screen.getByRole('button', { name: 'Export prompts to JSON file' });

    await act(async () => {
      fireEvent.click(exportBtn);
    });

    // saveFile should have been called with JSON content and a filename
    expect(mockSaveFile).toHaveBeenCalledTimes(1);
    const [jsonContent, fileName] = mockSaveFile.mock.calls[0] as [string, string];
    expect(fileName).toMatch(/^promptdock-export-.*\.json$/);

    // Verify the JSON contains the exported prompts
    const parsed = JSON.parse(jsonContent);
    expect(parsed.version).toBe('1.0');
    expect(parsed.prompts).toHaveLength(2);
    expect(parsed.prompts[0].title).toBe('Prompt A');
    expect(parsed.prompts[1].title).toBe('Prompt B');

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByRole('status').textContent).toContain('exported successfully');
    });
  });

  it('does not show export success when the save dialog is cancelled', async () => {
    mockSaveFile.mockResolvedValueOnce(false);

    render(<SettingsScreen onBack={() => {}} />);
    const exportBtn = screen.getByRole('button', { name: 'Export prompts to JSON file' });

    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(mockSaveFile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('displays validation errors when importing invalid JSON', async () => {
    mockOpenFile.mockResolvedValueOnce('not valid json {{{');

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Import failed');
      expect(alert.textContent).toContain('Invalid JSON');
    });
  });

  it('displays validation errors when importing JSON with missing required fields', async () => {
    mockOpenFile.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Import failed');
    });
  });

  it('imports valid prompts and adds them to PromptStore', async () => {
    const validJson = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: 'Imported Prompt', body: 'Imported body text' },
      ],
    });
    mockOpenFile.mockResolvedValueOnce(validJson);

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByRole('status').textContent).toContain('Imported 1 prompt(s)');
    });

    // Verify the prompt was added to the store via the repo
    expect(mockPromptRepo.create).toHaveBeenCalled();
  });

  it('does nothing when user cancels the file picker (openFile returns null)', async () => {
    mockOpenFile.mockResolvedValueOnce(null);

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    // No errors, no success message
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows duplicate resolution UI when importing prompts that match existing ones', async () => {
    // Seed an existing prompt
    const existing = makePrompt({ title: 'Existing Prompt', body: 'Existing body' });
    mockPromptRepo = createMockPromptRepo([existing]);
    testPromptStore = createPromptStore(mockPromptRepo);
    await testPromptStore.getState().loadPrompts();

    // Import JSON with a prompt that has the same title and body
    const importJson = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: 'Existing Prompt', body: 'Existing body' },
      ],
    });
    mockOpenFile.mockResolvedValueOnce(importJson);

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    // Should show duplicate resolution UI
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const dupeAlert = alerts.find((a) => a.textContent?.includes('duplicate'));
      expect(dupeAlert).toBeDefined();
      expect(dupeAlert!.textContent).toContain('1 duplicate(s) found');
      expect(dupeAlert!.textContent).toContain('Existing Prompt');
    });

    // Should show Skip and Overwrite buttons
    expect(screen.getByRole('button', { name: 'Skip duplicates' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Overwrite duplicates' })).toBeDefined();
  });

  it('skip duplicates imports only non-duplicate prompts', async () => {
    const existing = makePrompt({ title: 'Dupe Title', body: 'Dupe Body' });
    mockPromptRepo = createMockPromptRepo([existing]);
    testPromptStore = createPromptStore(mockPromptRepo);
    await testPromptStore.getState().loadPrompts();

    const importJson = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: 'Dupe Title', body: 'Dupe Body' },
        { title: 'New Prompt', body: 'New body' },
      ],
    });
    mockOpenFile.mockResolvedValueOnce(importJson);

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    // Wait for duplicate UI
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Skip duplicates' })).toBeDefined();
    });

    // Click Skip Duplicates
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip duplicates' }));
    });

    // Should show success message about skipping
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status.textContent).toContain('skipped');
      expect(status.textContent).toContain('1 duplicate');
    });
  });

  it('overwrite duplicates updates existing prompts and imports new ones', async () => {
    const existing = makePrompt({ id: 'existing-1', title: 'Dupe Title', body: 'Dupe Body' });
    mockPromptRepo = createMockPromptRepo([existing]);
    testPromptStore = createPromptStore(mockPromptRepo);
    await testPromptStore.getState().loadPrompts();

    const importJson = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: 'Dupe Title', body: 'Dupe Body', description: 'Updated description' },
        { title: 'Brand New', body: 'Brand new body' },
      ],
    });
    mockOpenFile.mockResolvedValueOnce(importJson);

    render(<SettingsScreen onBack={() => {}} />);
    const importBtn = screen.getByRole('button', { name: 'Import prompts from JSON file' });

    await act(async () => {
      fireEvent.click(importBtn);
    });

    // Wait for duplicate UI
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Overwrite duplicates' })).toBeDefined();
    });

    // Click Overwrite Duplicates
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Overwrite duplicates' }));
    });

    // Should show success message about overwriting
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status.textContent).toContain('overwrote');
      expect(status.textContent).toContain('1 duplicate');
    });

    // Verify update was called for the existing prompt
    expect(mockPromptRepo.update).toHaveBeenCalled();
    // Verify create was called for the new prompt
    expect(mockPromptRepo.create).toHaveBeenCalled();
  });
});
