// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserStorageBackend } from '../browser-storage-backend';

describe('BrowserStorageBackend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults browser prompt execution to copy', async () => {
    const backend = new BrowserStorageBackend();

    await backend.initialize();

    const settings = await backend.readSettings();
    expect(settings.defaultAction).toBe('copy');
  });

  it('merges missing stored settings with browser-safe defaults', async () => {
    localStorage.setItem('promptdock:settings', JSON.stringify({ theme: 'dark' }));
    const backend = new BrowserStorageBackend();

    await backend.initialize();

    const settings = await backend.readSettings();
    expect(settings).toEqual({
      hotkeyCombo: 'CommandOrControl+Shift+P',
      theme: 'dark',
      defaultAction: 'copy',
      activeWorkspaceId: 'local',
    });
  });

  it('warns when stored browser settings are invalid JSON', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('promptdock:settings', '{broken json');
    const backend = new BrowserStorageBackend();

    await backend.initialize();

    const settings = await backend.readSettings();
    expect(settings.defaultAction).toBe('copy');
    expect(warnSpy).toHaveBeenCalledWith(
      'Ignoring invalid browser storage JSON for key "promptdock:settings".',
      expect.any(SyntaxError),
    );
  });
});
