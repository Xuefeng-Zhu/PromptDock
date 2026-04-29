import type { UserSettings } from '../types';
import type { ISettingsRepository } from './interfaces';
import { localStorageBackend } from './local-storage-backend';

const DEFAULT_SETTINGS: UserSettings = {
  hotkeyCombo: 'CommandOrControl+Shift+P',
  theme: 'system',
  defaultAction: 'copy',
  activeWorkspaceId: 'local',
};

export class SettingsRepository implements ISettingsRepository {
  private store = localStorageBackend;

  async get(): Promise<UserSettings> {
    const settings = await this.store.read<UserSettings>('settings', 'settings');
    return settings ?? { ...DEFAULT_SETTINGS };
  }

  async update(changes: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.get();
    const updated = { ...current, ...changes };
    await this.store.write('settings', 'settings', updated);
    return updated;
  }
}
