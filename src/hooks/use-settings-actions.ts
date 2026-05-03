import { useCallback, useMemo, useState } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { registerHotkey } from '../utils/hotkey';
import { isTauriRuntime } from '../utils/runtime';
import {
  SETTINGS_NAV_ITEMS,
  type DefaultAction,
  type DensityOption,
  type ThemeOption,
} from '../components/settings/settings-data';

export function useSettingsActions() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [density, setDensity] = useState<DensityOption>('comfortable');
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const canUseGlobalHotkeys = isTauriRuntime();
  const visibleNavItems = useMemo(
    () =>
      canUseGlobalHotkeys
        ? SETTINGS_NAV_ITEMS
        : SETTINGS_NAV_ITEMS.filter((item) => item.id !== 'hotkey'),
    [canUseGlobalHotkeys],
  );

  const handleThemeChange = useCallback(
    async (theme: ThemeOption) => {
      setSettingsError(null);
      try {
        await updateSettings({ theme });
      } catch (err) {
        setSettingsError(
          `Failed to save theme: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [updateSettings],
  );

  const handleHotkeyChange = useCallback(
    async (hotkeyCombo: string): Promise<boolean> => {
      setHotkeyError(null);
      try {
        await registerHotkey(hotkeyCombo);
        await updateSettings({ hotkeyCombo });
        return true;
      } catch (err) {
        setHotkeyError(
          `Failed to register hotkey: ${err instanceof Error ? err.message : String(err)}`,
        );
        return false;
      }
    },
    [updateSettings],
  );

  const handleDefaultActionChange = useCallback(
    async (defaultAction: DefaultAction) => {
      setSettingsError(null);
      try {
        await updateSettings({ defaultAction });
      } catch (err) {
        setSettingsError(
          `Failed to save default action: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [updateSettings],
  );

  return {
    canUseGlobalHotkeys,
    density,
    handleDefaultActionChange,
    handleHotkeyChange,
    handleThemeChange,
    hotkeyError,
    setDensity,
    settings,
    settingsError,
    visibleNavItems,
  };
}
