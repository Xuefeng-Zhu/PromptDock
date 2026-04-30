/**
 * File dialog utilities for saving and opening files.
 * Uses browser APIs for file operations. When Tauri dialog/fs plugins are
 * installed, this module can be extended to use native dialogs.
 */

/**
 * Save content to a file using a browser download.
 * Returns true if the download was triggered.
 */
export async function saveFile(content: string, defaultName: string): Promise<boolean> {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Open a file using a browser file input.
 * Returns the file content as a string, or null if the user cancelled.
 */
export async function openFile(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
