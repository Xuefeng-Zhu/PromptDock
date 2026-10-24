/**
 * File dialog utilities for saving and opening files.
 * Uses native Tauri save dialogs in the desktop shell and browser downloads elsewhere.
 */

import { isTauriRuntime } from './runtime';

/**
 * Saves JSON through Tauri or starts a standard browser download, accessible to
 * browsers without native picker automation. Returns false on Tauri cancellation;
 * browser success means download initiated, not confirmation of a disk write.
 */
export async function saveFile(content: string, defaultName: string): Promise<boolean> {
  if (isTauriRuntime()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ]);

    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) {
      return false;
    }

    await writeTextFile(path, content);
    return true;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep the URL alive until the browser has consumed the click's default action.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/**
 * Open a file using a browser file input.
 * Returns the file content as a string, or null if the user cancelled.
 */
export async function openFile(): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    input.setAttribute('aria-label', 'Import prompts from JSON file');
    const finish = (content: string | null) => {
      input.remove();
      resolve(content);
    };
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => finish(reader.result as string);
      reader.onerror = () => finish(null);
      reader.readAsText(file);
    };
    input.oncancel = () => finish(null);
    // Keep the pending chooser discoverable to DOM-based file selection.
    document.body.appendChild(input);
    try {
      input.click();
    } catch (error) {
      input.remove();
      reject(error);
    }
  });
}
