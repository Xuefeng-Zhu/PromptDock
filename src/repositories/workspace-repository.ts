import { v4 as uuidv4 } from 'uuid';
import type { Workspace } from '../types';
import type { IWorkspaceRepository } from './interfaces';
import { localStorageBackend } from './local-storage-backend';

export class WorkspaceRepository implements IWorkspaceRepository {
  private store = localStorageBackend;

  async create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const now = new Date();
    const ws: Workspace = { ...workspace, id: uuidv4(), createdAt: now, updatedAt: now };
    const all = await this.store.readAll<Workspace>('workspace');
    all.push(ws);
    await this.store.writeAll('workspace', all);
    return ws;
  }

  async getById(id: string): Promise<Workspace | null> {
    const all = await this.store.readAll<Workspace>('workspace');
    return all.find((w) => w.id === id) ?? null;
  }

  async listForUser(userId: string): Promise<Workspace[]> {
    const all = await this.store.readAll<Workspace>('workspace');
    return all.filter((w) => w.ownerId === userId);
  }

  async update(id: string, changes: Partial<Workspace>): Promise<Workspace> {
    const all = await this.store.readAll<Workspace>('workspace');
    const idx = all.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workspace ${id} not found`);
    all[idx] = { ...all[idx], ...changes, updatedAt: new Date() };
    await this.store.writeAll('workspace', all);
    return all[idx];
  }
}
