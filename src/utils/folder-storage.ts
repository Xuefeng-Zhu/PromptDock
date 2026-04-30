import type { Folder } from '../types/index';

// ─── Folder Storage Utility ────────────────────────────────────────────────────
// Persists user-created folders via browser localStorage.
// This provides a simple persistence mechanism that works in both Tauri and
// browser environments. The LocalStorageBackend (Tauri Store) handles the
// full folder data for production; this utility is the lightweight bridge
// for the UI layer.

const FOLDERS_KEY = 'promptdock_folders';

/**
 * Read persisted folders from localStorage.
 */
export function readFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    }>;
    return parsed.map((f) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Write folders to localStorage.
 */
export function writeFolders(folders: Folder[]): void {
  const serialized = folders.map((f) => ({
    id: f.id,
    name: f.name,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(serialized));
}

/**
 * Create a new folder and persist it. Returns the created folder.
 */
export function createFolder(name: string): Folder {
  const now = new Date();
  const id = `folder-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const folder: Folder = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };
  const existing = readFolders();
  writeFolders([...existing, folder]);
  return folder;
}
