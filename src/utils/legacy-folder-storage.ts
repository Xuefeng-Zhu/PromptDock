import type { Folder } from '../types/index';

const LEGACY_FOLDERS_KEY = 'promptdock_folders';

interface SerializedLegacyFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readLegacyFolders(): Folder[] {
  if (!hasLocalStorage()) return [];

  try {
    const raw = localStorage.getItem(LEGACY_FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedLegacyFolder[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((folder) => folder && typeof folder.id === 'string' && typeof folder.name === 'string')
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt),
      }));
  } catch {
    return [];
  }
}

export function clearLegacyFolders(): void {
  if (!hasLocalStorage()) return;
  localStorage.removeItem(LEGACY_FOLDERS_KEY);
}
