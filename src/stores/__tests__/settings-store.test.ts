import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoreApi } from 'zustand';
import type { UserSettings } from '../../types/index';
import type { ISettingsRepository } from '../../repositories/interfaces';
import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  type SettingsStore,
} from '../settings-store';

// ─── Mock Repository ───────────────────────────────────────────────────────────

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

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsStore', () => {
  let repo: ISettingsRepository;
  let store: StoreApi<SettingsStore>;

  beforeEach(() => {
    repo = createMockRepo();
    store = createSettingsStore(repo);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have default settings', () => {
      expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should default hotkeyCombo to "CommandOrControl+Shift+P"', () => {
      expect(store.getState().settings.hotkeyCombo).toBe(
        'CommandOrControl+Shift+P',
      );
    });

    it('should default theme to "system"', () => {
      expect(store.getState().settings.theme).toBe('system');
    });

    it('should default defaultAction to "copy"', () => {
      expect(store.getState().settings.defaultAction).toBe('copy');
    });

    it('should default activeWorkspaceId to "local"', () => {
      expect(store.getState().settings.activeWorkspaceId).toBe('local');
    });
  });

  // ── loadSettings ───────────────────────────────────────────────────────────

  describe('loadSettings', () => {
    it('should load settings from the repository', async () => {
      const customSettings: UserSettings = {
        hotkeyCombo: 'Alt+P',
        theme: 'dark',
        defaultAction: 'paste',
        activeWorkspaceId: 'ws-1',
      };
      repo = createMockRepo(customSettings);
      store = createSettingsStore(repo);

      await store.getState().loadSettings();

      expect(repo.get).toHaveBeenCalled();
      expect(store.getState().settings).toEqual(customSettings);
    });

    it('should replace current settings on reload', async () => {
      await store.getState().loadSettings();
      const first = store.getState().settings;

      await store.getState().loadSettings();
      const second = store.getState().settings;

      expect(first).toEqual(second);
      expect(repo.get).toHaveBeenCalledTimes(2);
    });
  });

  // ── updateSettings ─────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    it('should update theme setting', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({ theme: 'dark' });

      expect(repo.update).toHaveBeenCalledWith({ theme: 'dark' });
      expect(store.getState().settings.theme).toBe('dark');
    });

    it('should update hotkeyCombo setting', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({ hotkeyCombo: 'Alt+Space' });

      expect(store.getState().settings.hotkeyCombo).toBe('Alt+Space');
    });

    it('should update defaultAction setting', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({ defaultAction: 'paste' });

      expect(store.getState().settings.defaultAction).toBe('paste');
    });

    it('should update activeWorkspaceId setting', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({ activeWorkspaceId: 'ws-2' });

      expect(store.getState().settings.activeWorkspaceId).toBe('ws-2');
    });

    it('should update multiple settings at once', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({
        theme: 'light',
        defaultAction: 'paste',
      });

      expect(store.getState().settings.theme).toBe('light');
      expect(store.getState().settings.defaultAction).toBe('paste');
    });

    it('should preserve unchanged settings when updating a subset', async () => {
      await store.getState().loadSettings();
      await store.getState().updateSettings({ theme: 'dark' });

      expect(store.getState().settings.hotkeyCombo).toBe(
        'CommandOrControl+Shift+P',
      );
      expect(store.getState().settings.defaultAction).toBe('copy');
      expect(store.getState().settings.activeWorkspaceId).toBe('local');
    });
  });
});
