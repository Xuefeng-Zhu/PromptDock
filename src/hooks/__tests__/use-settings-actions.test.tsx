// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISettingsRepository } from '../../repositories/interfaces';
import { DEFAULT_SETTINGS, initSettingsStore } from '../../stores/settings-store';
import type { UserSettings } from '../../types/index';
import { useSettingsActions } from '../use-settings-actions';

const mockRegisterHotkey = vi.hoisted(() => vi.fn());

vi.mock('../../utils/hotkey', () => ({
  registerHotkey: (...args: unknown[]) => mockRegisterHotkey(...args),
}));

function createSettingsRepo(
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

function enableTauriRuntime() {
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  });
}

function disableTauriRuntime() {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

describe('useSettingsActions', () => {
  beforeEach(() => {
    disableTauriRuntime();
    mockRegisterHotkey.mockResolvedValue(undefined);
    initSettingsStore(createSettingsRepo());
  });

  afterEach(() => {
    disableTauriRuntime();
    vi.clearAllMocks();
  });

  it('hides hotkey navigation outside the Tauri runtime', () => {
    const { result } = renderHook(() => useSettingsActions());

    expect(result.current.canUseGlobalHotkeys).toBe(false);
    expect(result.current.visibleNavItems.map((item) => item.id)).not.toContain('hotkey');
  });

  it('updates settings and reports save failures through settingsError', async () => {
    const repo = createSettingsRepo();
    initSettingsStore(repo);
    const { result } = renderHook(() => useSettingsActions());

    await act(async () => {
      await result.current.handleThemeChange('dark');
    });

    expect(repo.update).toHaveBeenCalledWith({ theme: 'dark' });
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settingsError).toBeNull();

    const failingRepo = createSettingsRepo();
    vi.mocked(failingRepo.update).mockRejectedValueOnce(new Error('disk full'));
    initSettingsStore(failingRepo);
    const failing = renderHook(() => useSettingsActions());

    await act(async () => {
      await failing.result.current.handleDefaultActionChange('copy');
    });

    expect(failing.result.current.settingsError).toContain('disk full');
  });

  it('registers hotkeys before saving them in the Tauri runtime', async () => {
    enableTauriRuntime();
    const repo = createSettingsRepo();
    initSettingsStore(repo);
    const { result } = renderHook(() => useSettingsActions());

    expect(result.current.canUseGlobalHotkeys).toBe(true);
    expect(result.current.visibleNavItems.map((item) => item.id)).toContain('hotkey');

    await act(async () => {
      await expect(result.current.handleHotkeyChange('CommandOrControl+K')).resolves.toBe(true);
    });

    expect(mockRegisterHotkey).toHaveBeenCalledWith('CommandOrControl+K');
    expect(repo.update).toHaveBeenCalledWith({ hotkeyCombo: 'CommandOrControl+K' });
    expect(result.current.hotkeyError).toBeNull();
  });

  it('keeps settings unchanged and exposes a hotkey error when registration fails', async () => {
    enableTauriRuntime();
    const repo = createSettingsRepo();
    initSettingsStore(repo);
    mockRegisterHotkey.mockRejectedValueOnce(new Error('already taken'));
    const { result } = renderHook(() => useSettingsActions());

    await act(async () => {
      await expect(result.current.handleHotkeyChange('CommandOrControl+K')).resolves.toBe(false);
    });

    expect(repo.update).not.toHaveBeenCalled();
    expect(result.current.hotkeyError).toContain('already taken');
  });
});
