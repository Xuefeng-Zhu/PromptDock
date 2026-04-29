import type { Workspace } from '../types/index';
import type { IWorkspaceRepository } from './interfaces';
import type { LocalStorageBackend } from './local-storage-backend';

// ─── WorkspaceRepository ───────────────────────────────────────────────────────
// Implements IWorkspaceRepository by delegating to LocalStorageBackend.
// In Local Mode, manages a single default workspace (id='local', name='My Prompts',
// ownerId='local'). The workspace is read from / written to the backend on every
// mutation.

const LOCAL_WORKSPACE_ID = 'local';

export class WorkspaceRepository implements IWorkspaceRepository {
  private workspace: Workspace | null = null;
  private loaded = false;

  constructor(private readonly backend: LocalStorageBackend) {}

  /**
   * Ensure the in-memory workspace is populated from the backend.
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.workspace = await this.backend.readWorkspace();
      this.loaded = true;
    }
  }

  /**
   * Persist the current workspace to the backend.
   */
  private async persist(): Promise<void> {
    if (this.workspace) {
      await this.backend.writeWorkspace(this.workspace);
    }
  }

  async create(
    workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Workspace> {
    await this.ensureLoaded();

    // In Local Mode, we only support a single workspace. Creating a new one
    // overwrites the existing local workspace.
    const now = new Date();
    const newWorkspace: Workspace = {
      ...workspace,
      id: LOCAL_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
    };

    this.workspace = newWorkspace;
    await this.persist();
    return newWorkspace;
  }

  async getById(id: string): Promise<Workspace | null> {
    await this.ensureLoaded();

    if (!this.workspace || this.workspace.id !== id) {
      return null;
    }

    return this.workspace;
  }

  async listForUser(_userId: string): Promise<Workspace[]> {
    await this.ensureLoaded();

    // In Local Mode, return the single local workspace regardless of userId.
    if (this.workspace) {
      return [this.workspace];
    }

    return [];
  }

  async update(
    id: string,
    changes: Partial<Workspace>,
  ): Promise<Workspace> {
    await this.ensureLoaded();

    if (!this.workspace || this.workspace.id !== id) {
      throw new Error(`Workspace not found: ${id}`);
    }

    const updated: Workspace = {
      ...this.workspace,
      ...changes,
      id: this.workspace.id, // prevent id overwrite
      updatedAt: new Date(),
    };

    this.workspace = updated;
    await this.persist();
    return updated;
  }
}
