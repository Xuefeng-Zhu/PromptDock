import { invoke } from '@tauri-apps/api/core';

/**
 * Copies text to the system clipboard.
 * Tries the Tauri native `copy_to_clipboard` command first.
 * Falls back to the browser `navigator.clipboard.writeText` API
 * when running outside Tauri or if the command fails.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await invoke('copy_to_clipboard', { text });
  } catch {
    await navigator.clipboard.writeText(text);
  }
}

/**
 * Copies text to the clipboard and then pastes it into the active application.
 * First copies via `copyToClipboard`, then invokes the Tauri `paste_to_active_app`
 * command. If the paste command fails (e.g. outside Tauri), the text remains
 * on the clipboard for manual pasting.
 */
export async function pasteToActiveApp(text: string): Promise<void> {
  await copyToClipboard(text);
  try {
    await invoke('paste_to_active_app');
  } catch {
    // Paste not available outside Tauri — text is on clipboard
  }
}
