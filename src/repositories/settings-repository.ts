import type { UserSettings } from '../types/index';
import type { ISettingsRepository, IStorageBackend } from './interfaces';

// ─── Default Settings ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  hotkeyCombo: 'CommandOrControl+Shift+P',
  theme: 'system',
  defaultAction: 'paste',
  activeWorkspaceId: 'local',
};

// ─── SettingsRepository ────────────────────────────────────────────────────────
// Implements ISettingsRepository by delegating to an IStorageBackend.
// Uses lazy loading with an in-memory cache. Settings are read from the backend
// on first access and persisted on every mutation.

export class SettingsRepository implements ISettingsRepository {
  private settings: UserSettings | null = null;
  private loaded = false;

  constructor(private readonly backend: IStorageBackend) {}

  /**
   * Ensure the in-memory settings are populated from the backend.
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.settings = await this.backend.readSettings();
      this.loaded = true;
    }
  }

  /**
   * Persist the current settings to the backend.
   */
  private async persist(): Promise<void> {
    if (this.settings) {
      await this.backend.writeSettings(this.settings);
    }
  }

  async get(): Promise<UserSettings> {
    await this.ensureLoaded();
    // Return a copy to prevent external mutation of the cache
    return { ...this.settings! };
  }

  async update(changes: Partial<UserSettings>): Promise<UserSettings> {
    await this.ensureLoaded();

    const updated: UserSettings = {
      ...this.settings!,
      ...changes,
    };

    this.settings = updated;
    await this.persist();
    return { ...updated };
  }
}
