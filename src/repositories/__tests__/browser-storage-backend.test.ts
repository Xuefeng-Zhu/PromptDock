// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { BrowserStorageBackend } from '../browser-storage-backend';

describe('BrowserStorageBackend', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
