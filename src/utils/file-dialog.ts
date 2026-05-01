/**
 * File dialog utilities for saving and opening files.
 * Uses native Tauri dialogs in the desktop shell and browser APIs elsewhere.
 */

type BrowserFileHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type BrowserSavePicker = {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<BrowserFileHandle>;
};

function isTauriRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Save content to a JSON file.
 * Returns false when the user cancels the save picker.
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

  const browserSavePicker = (window as Window & BrowserSavePicker).showSaveFilePicker;
  if (browserSavePicker) {
    try {
      const handle = await browserSavePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'JSON file',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([content], { type: 'application/json' }));
      await writable.close();
      return true;
    } catch (error) {
      if (isAbortError(error)) {
        return false;
      }
      throw error;
    }
  }

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
