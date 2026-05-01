import { invoke } from '@tauri-apps/api/core';

function copyViaSelection(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0';

  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      if (previousRange) {
        selection.addRange(previousRange);
      }
    }
  }
}

async function copyWithBrowserFallback(text: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the selection-based copy path below.
  }

  if (copyViaSelection(text)) {
    return;
  }

  throw new Error('Clipboard write is not available in this browser context');
}

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
    await copyWithBrowserFallback(text);
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
