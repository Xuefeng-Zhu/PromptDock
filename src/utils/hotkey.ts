import { invoke } from '@tauri-apps/api/core';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function normalizeHotkeyCombo(combo: string): string {
  return combo
    .split('+')
    .map((part) => {
      const token = part.trim();
      if (token === '⌘' || token === 'Cmd' || token === 'Command' || token === 'Meta') {
        return 'CommandOrControl';
      }
      if (token === 'Ctrl') return 'Control';
      if (token === 'Esc') return 'Escape';
      if (token === 'Spacebar' || token === ' ') return 'Space';
      return token;
    })
    .filter(Boolean)
    .join('+');
}

/**
 * Registers a global hotkey combination via the Tauri `register_hotkey` command.
 * When the hotkey is pressed system-wide, Tauri toggles the QuickLauncherWindow visibility.
 *
 * @param combo - The hotkey combination string (e.g. "CommandOrControl+Shift+P").
 *                If empty, the current hotkey is unregistered in Tauri.
 * @throws If the Tauri command fails (e.g. invalid combo, OS-level conflict).
 */
export async function registerHotkey(combo: string): Promise<void> {
  const shortcut = normalizeHotkeyCombo(combo);

  if (!isTauriRuntime()) {
    return;
  }

  if (!shortcut) {
    await invoke('unregister_hotkey');
    return;
  }

  await invoke('register_hotkey', { shortcut });
}
