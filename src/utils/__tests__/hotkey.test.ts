// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerHotkey } from '../hotkey';

// ─── Mock Tauri invoke ─────────────────────────────────────────────────────────

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

beforeEach(() => {
  mockInvoke.mockReset();
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
});

function mockTauriRuntime() {
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  });
}

// ─── registerHotkey utility tests ──────────────────────────────────────────────

describe('registerHotkey', () => {
  it('invokes the Tauri register_hotkey command with the given combo', async () => {
    mockTauriRuntime();
    mockInvoke.mockResolvedValueOnce(undefined);

    await registerHotkey('CommandOrControl+Shift+P');

    expect(mockInvoke).toHaveBeenCalledWith('register_hotkey', {
      shortcut: 'CommandOrControl+Shift+P',
    });
  });

  it('unregisters the active hotkey when combo is an empty string', async () => {
    mockTauriRuntime();
    mockInvoke.mockResolvedValueOnce(undefined);

    await registerHotkey('');

    expect(mockInvoke).toHaveBeenCalledWith('unregister_hotkey');
  });

  it('normalizes display-only modifier tokens before registering', async () => {
    mockTauriRuntime();
    mockInvoke.mockResolvedValueOnce(undefined);

    await registerHotkey('⌘+Shift+P');

    expect(mockInvoke).toHaveBeenCalledWith('register_hotkey', {
      shortcut: 'CommandOrControl+Shift+P',
    });
  });

  it('propagates errors from the Tauri command', async () => {
    mockTauriRuntime();
    mockInvoke.mockRejectedValueOnce(new Error('Hotkey already in use'));

    await expect(registerHotkey('Ctrl+Space')).rejects.toThrow(
      'Hotkey already in use',
    );
  });

  it('does not call Tauri when running in a browser preview', async () => {
    await registerHotkey('CommandOrControl+Shift+A');

    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
