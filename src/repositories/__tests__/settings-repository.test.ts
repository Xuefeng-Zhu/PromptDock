import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserSettings } from '../../types/index';
import { SettingsRepository, DEFAULT_SETTINGS } from '../settings-repository';
import type { LocalStorageBackend } from '../local-storage-backend';

// ─── Mock LocalStorageBackend ──────────────────────────────────────────────────

function createMockBackend(initial?: UserSettings): LocalStorageBackend {
  let stored: UserSettings = initial ? { ...initial } : { ...DEFAULT_SETTINGS };

  return {
    readSettings: vi.fn(async () => ({ ...stored })),
    writeSettings: vi.fn(async (settings: UserSettings) => {
      stored = { ...settings };
    }),
  } as unknown as LocalStorageBackend;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsRepository', () => {
  let backend: LocalStorageBackend;
  let repo: SettingsRepository;

  beforeEach(() => {
    backend = createMockBackend();
    repo = new SettingsRepository(backend);
  });

  describe('get', () => {
    it('should return default settings on first access', async () => {
      const result = await repo.get();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('should load from backend on first access', async () => {
      await repo.get();

      expect(backend.readSettings).toHaveBeenCalledOnce();
    });

    it('should use cached data on subsequent accesses', async () => {
      await repo.get();
      await repo.get();

      expect(backend.readSettings).toHaveBeenCalledOnce();
    });

    it('should return a copy, not the internal reference', async () => {
      const first = await repo.get();
      const second = await repo.get();

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });

    it('should return custom settings when backend has non-default values', async () => {
      const custom: UserSettings = {
        hotkeyCombo: 'Alt+P',
        theme: 'dark',
        defaultAction: 'copy',
        activeWorkspaceId: 'workspace-123',
      };
      backend = createMockBackend(custom);
      repo = new SettingsRepository(backend);

      const result = await repo.get();

      expect(result).toEqual(custom);
    });
  });

  describe('update', () => {
    it('should update a single field', async () => {
      const result = await repo.update({ theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(result.hotkeyCombo).toBe(DEFAULT_SETTINGS.hotkeyCombo);
      expect(result.defaultAction).toBe(DEFAULT_SETTINGS.defaultAction);
      expect(result.activeWorkspaceId).toBe(DEFAULT_SETTINGS.activeWorkspaceId);
    });

    it('should update multiple fields at once', async () => {
      const result = await repo.update({
        theme: 'light',
        defaultAction: 'copy',
      });

      expect(result.theme).toBe('light');
      expect(result.defaultAction).toBe('copy');
      expect(result.hotkeyCombo).toBe(DEFAULT_SETTINGS.hotkeyCombo);
    });

    it('should update the hotkey combo', async () => {
      const result = await repo.update({ hotkeyCombo: 'Alt+Shift+K' });

      expect(result.hotkeyCombo).toBe('Alt+Shift+K');
    });

    it('should update the active workspace id', async () => {
      const result = await repo.update({ activeWorkspaceId: 'workspace-abc' });

      expect(result.activeWorkspaceId).toBe('workspace-abc');
    });

    it('should persist the updated settings to the backend', async () => {
      await repo.update({ theme: 'dark' });

      expect(backend.writeSettings).toHaveBeenCalledOnce();
      expect(backend.writeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'dark' }),
      );
    });

    it('should reflect updates in subsequent get calls', async () => {
      await repo.update({ theme: 'light' });
      const result = await repo.get();

      expect(result.theme).toBe('light');
    });

    it('should apply sequential updates cumulatively', async () => {
      await repo.update({ theme: 'dark' });
      await repo.update({ defaultAction: 'copy' });

      const result = await repo.get();
      expect(result.theme).toBe('dark');
      expect(result.defaultAction).toBe('copy');
    });

    it('should return a copy, not the internal reference', async () => {
      const result = await repo.update({ theme: 'dark' });
      const fetched = await repo.get();

      expect(result).toEqual(fetched);
      expect(result).not.toBe(fetched);
    });

    it('should preserve fields not included in changes', async () => {
      const result = await repo.update({ theme: 'light' });

      expect(result.hotkeyCombo).toBe(DEFAULT_SETTINGS.hotkeyCombo);
      expect(result.defaultAction).toBe(DEFAULT_SETTINGS.defaultAction);
      expect(result.activeWorkspaceId).toBe(DEFAULT_SETTINGS.activeWorkspaceId);
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have the correct default hotkey combo', () => {
      expect(DEFAULT_SETTINGS.hotkeyCombo).toBe('CommandOrControl+Shift+P');
    });

    it('should have the correct default theme', () => {
      expect(DEFAULT_SETTINGS.theme).toBe('system');
    });

    it('should have the correct default action', () => {
      expect(DEFAULT_SETTINGS.defaultAction).toBe('paste');
    });

    it('should have the correct default active workspace id', () => {
      expect(DEFAULT_SETTINGS.activeWorkspaceId).toBe('local');
    });
  });
});
