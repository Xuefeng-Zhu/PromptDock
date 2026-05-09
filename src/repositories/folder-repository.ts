import type { Folder } from '../types/index';
import { cleanFolderName, createFolderId, normalizeFolderName } from '../utils/folder-names';
import type { IFolderRepository, IStorageBackend } from './interfaces';

/**
 * Creates a stable local folder id and appends a numeric suffix on collision.
 * Name uniqueness is checked separately, so collisions here are mostly from
 * legacy data or manually edited storage.
 */
function createUniqueFolderId(name: string, folders: Folder[]): string {
  const baseId = createFolderId(name);
  const existingIds = new Set(folders.map((folder) => folder.id));
  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  let candidate = `${baseId}-${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  return candidate;
}

/**
 * Local folder repository with optional Firestore delegation for synced mode.
 * Local operations cache folders in memory and persist the full collection after
 * each mutation; synced operations are forwarded to the active delegate.
 */
export class FolderRepository implements IFolderRepository {
  private folders: Folder[] = [];
  private loaded = false;
  private firestoreDelegate: IFolderRepository | null = null;

  constructor(private readonly backend: IStorageBackend) {}

  setFirestoreDelegate(delegate: IFolderRepository | null): void {
    this.firestoreDelegate = delegate;
  }

  hasFirestoreDelegate(): boolean {
    return this.firestoreDelegate !== null;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.folders = await this.backend.readFolders();
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await this.backend.writeFolders(this.folders);
  }

  async getAllFolders(workspaceId: string): Promise<Folder[]> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.getAllFolders(workspaceId);
    }

    await this.ensureLoaded();
    return this.folders.map((folder) => ({ ...folder }));
  }

  async reloadAllFolders(workspaceId: string): Promise<Folder[]> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.reloadAllFolders
        ? this.firestoreDelegate.reloadAllFolders(workspaceId)
        : this.firestoreDelegate.getAllFolders(workspaceId);
    }

    this.folders = await this.backend.readFolders();
    this.loaded = true;
    return this.folders.map((folder) => ({ ...folder }));
  }

  async createFolder(name: string, workspaceId: string): Promise<Folder> {
    const cleanedName = cleanFolderName(name);
    if (!cleanedName) {
      throw new Error('Folder name is required.');
    }

    if (this.firestoreDelegate) {
      return this.firestoreDelegate.createFolder(cleanedName, workspaceId);
    }

    await this.ensureLoaded();

    const existing = this.folders.find(
      (folder) => normalizeFolderName(folder.name) === normalizeFolderName(cleanedName),
    );
    if (existing) {
      return { ...existing };
    }

    const now = new Date();
    const folder: Folder = {
      id: createUniqueFolderId(cleanedName, this.folders),
      name: cleanedName,
      createdAt: now,
      updatedAt: now,
    };

    this.folders.push(folder);
    await this.persist();
    return { ...folder };
  }

  async deleteFolder(id: string, workspaceId: string): Promise<void> {
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.deleteFolder(id, workspaceId);
    }

    await this.ensureLoaded();

    const initialLength = this.folders.length;
    this.folders = this.folders.filter((folder) => folder.id !== id);
    if (this.folders.length === initialLength) {
      throw new Error(`Folder not found: ${id}`);
    }

    await this.persist();
  }
}
