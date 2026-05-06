import type { Folder } from '../types/index';
import { cleanFolderName, createFolderId, normalizeFolderName } from '../utils/folder-names';
import type { IFolderRepository, IStorageBackend } from './interfaces';

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

  async replaceLocalFolders(folders: Folder[]): Promise<void> {
    this.folders = folders.map((folder) => ({ ...folder }));
    this.loaded = true;
    await this.persist();
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
    if (this.firestoreDelegate) {
      return this.firestoreDelegate.createFolder(name, workspaceId);
    }

    const cleanedName = cleanFolderName(name);
    if (!cleanedName) {
      throw new Error('Folder name is required.');
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
      id: createFolderId(cleanedName),
      name: cleanedName,
      createdAt: now,
      updatedAt: now,
    };

    this.folders.push(folder);
    await this.persist();
    return { ...folder };
  }
}
