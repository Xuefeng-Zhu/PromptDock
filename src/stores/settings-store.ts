import { create, type StoreApi, useStore } from 'zustand';
import type { UserSettings } from '../types/index';
import type { ISettingsRepository } from '../repositories/interfaces';

// ─── Default Settings ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  hotkeyCombo: 'CommandOrControl+Shift+P',
  theme: 'system',
  defaultAction: 'copy',
  activeWorkspaceId: 'local',
};

// ─── SettingsStore ─────────────────────────────────────────────────────────────

export interface SettingsStore {
  // State
  settings: UserSettings;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>;
}

// ─── Factory ───────────────────────────────────────────────────────────────────
// Accepts a SettingsRepository instance (dependency injection) and returns a
// fully-wired Zustand store.

export function createSettingsStore(repo: ISettingsRepository) {
  return create<SettingsStore>((set) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    settings: { ...DEFAULT_SETTINGS },

    // ── Actions ──────────────────────────────────────────────────────────────

    async loadSettings() {
      const settings = await repo.get();
      set({ settings });
    },

    async updateSettings(changes: Partial<UserSettings>) {
      const updated = await repo.update(changes);
      set({ settings: updated });
    },
  }));
}

// ─── Singleton convenience hook ────────────────────────────────────────────────
// For production use, call `initSettingsStore` once at app startup with the real
// repository, then use `useSettingsStore` in components.

let _store: StoreApi<SettingsStore> | null = null;

export function initSettingsStore(repo: ISettingsRepository): StoreApi<SettingsStore> {
  _store = createSettingsStore(repo);
  return _store;
}

export function useSettingsStore(): SettingsStore;
export function useSettingsStore<T>(selector: (state: SettingsStore) => T): T;
export function useSettingsStore<T>(selector?: (state: SettingsStore) => T) {
  if (!_store) {
    throw new Error(
      'SettingsStore has not been initialised. Call initSettingsStore(repo) before using useSettingsStore.',
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return selector ? useStore(_store, selector) : useStore(_store);
}
