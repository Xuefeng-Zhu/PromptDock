/**
 * Detects whether the app is running inside the Tauri desktop shell.
 */
export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
