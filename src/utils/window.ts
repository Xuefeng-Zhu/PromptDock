import { invoke } from '@tauri-apps/api/core';

/**
 * Best-effort helper for desktop-only window commands. Browser runs and tests
 * can safely ignore failures because these commands only exist in Tauri.
 */
export async function hideMainWindow(): Promise<void> {
  try {
    await invoke('hide_main_window');
  } catch {
    // Not running in Tauri, or the window command is unavailable.
  }
}
