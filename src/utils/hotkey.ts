import { invoke } from '@tauri-apps/api/core';

/**
 * Registers a global hotkey combination via the Tauri `register_hotkey` command.
 * When the hotkey is pressed system-wide, Tauri toggles the QuickLauncherWindow visibility.
 *
 * @param combo - The hotkey combination string (e.g. "CommandOrControl+Shift+P").
 *                If empty, the call is skipped (no hotkey registered).
 * @throws If the Tauri command fails (e.g. invalid combo, OS-level conflict).
 */
export async function registerHotkey(combo: string): Promise<void> {
  if (!combo) return;
  await invoke('register_hotkey', { combo });
}
