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
});

// ─── registerHotkey utility tests ──────────────────────────────────────────────

describe('registerHotkey', () => {
  it('invokes the Tauri register_hotkey command with the given combo', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await registerHotkey('CommandOrControl+Shift+P');

    expect(mockInvoke).toHaveBeenCalledWith('register_hotkey', {
      combo: 'CommandOrControl+Shift+P',
    });
  });

  it('skips invocation when combo is an empty string', async () => {
    await registerHotkey('');

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('propagates errors from the Tauri command', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Hotkey already in use'));

    await expect(registerHotkey('Ctrl+Space')).rejects.toThrow(
      'Hotkey already in use',
    );
  });
});
