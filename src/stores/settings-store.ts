import { create } from 'zustand';
import type { UserSettings } from '../types';
import { SettingsRepository } from '../repositories/settings-repository';

const repo = new SettingsRepository();

interface SettingsStore {
  settings: UserSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {
    hotkeyCombo: 'CommandOrControl+Shift+P',
    theme: 'system',
    defaultAction: 'copy',
    activeWorkspaceId: 'local',
  },

  loadSettings: async () => {
    const settings = await repo.get();
    set({ settings });
  },

  updateSettings: async (changes) => {
    const settings = await repo.update(changes);
    set({ settings });
  },
}));
