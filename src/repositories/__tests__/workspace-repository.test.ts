import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workspace } from '../../types/index';
import { WorkspaceRepository } from '../workspace-repository';
import type { LocalStorageBackend } from '../local-storage-backend';

// ─── Mock LocalStorageBackend ──────────────────────────────────────────────────

const DEFAULT_WORKSPACE: Workspace = {
  id: 'local',
  name: 'My Prompts',
  ownerId: 'local',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createMockBackend(initial?: Workspace): LocalStorageBackend {
  let stored: Workspace = initial ? { ...initial } : { ...DEFAULT_WORKSPACE };

  return {
    readWorkspace: vi.fn(async () => ({ ...stored })),
    writeWorkspace: vi.fn(async (workspace: Workspace) => {
      stored = { ...workspace };
    }),
  } as unknown as LocalStorageBackend;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkspaceRepository', () => {
  let backend: LocalStorageBackend;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    backend = createMockBackend();
    repo = new WorkspaceRepository(backend);
  });

  describe('getById', () => {
    it('should return the local workspace when id matches', async () => {
      const result = await repo.getById('local');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('local');
      expect(result!.name).toBe('My Prompts');
      expect(result!.ownerId).toBe('local');
    });

    it('should return null when id does not match', async () => {
      const result = await repo.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should load from backend on first access', async () => {
      await repo.getById('local');

      expect(backend.readWorkspace).toHaveBeenCalledOnce();
    });

    it('should use cached data on subsequent accesses', async () => {
      await repo.getById('local');
      await repo.getById('local');

      expect(backend.readWorkspace).toHaveBeenCalledOnce();
    });
  });

  describe('listForUser', () => {
    it('should return the single local workspace', async () => {
      const result = await repo.listForUser('local');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('local');
      expect(result[0].name).toBe('My Prompts');
    });

    it('should return the local workspace regardless of userId', async () => {
      const result = await repo.listForUser('some-other-user');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('local');
    });
  });

  describe('create', () => {
    it('should create a workspace with local id and timestamps', async () => {
      const before = new Date();
      const result = await repo.create({
        name: 'New Workspace',
        ownerId: 'local',
      });

      expect(result.id).toBe('local');
      expect(result.name).toBe('New Workspace');
      expect(result.ownerId).toBe('local');
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should persist the created workspace to the backend', async () => {
      await repo.create({
        name: 'Persisted Workspace',
        ownerId: 'local',
      });

      expect(backend.writeWorkspace).toHaveBeenCalled();
    });

    it('should overwrite the existing workspace in local mode', async () => {
      await repo.create({
        name: 'Overwritten',
        ownerId: 'local',
      });

      const result = await repo.getById('local');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Overwritten');
    });
  });

  describe('update', () => {
    it('should update workspace fields and set updatedAt', async () => {
      const before = new Date();
      const result = await repo.update('local', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should not allow id to be overwritten', async () => {
      const result = await repo.update('local', {
        id: 'new-id',
      } as Partial<Workspace>);

      expect(result.id).toBe('local');
    });

    it('should persist the updated workspace to the backend', async () => {
      await repo.update('local', { name: 'Persisted Update' });

      expect(backend.writeWorkspace).toHaveBeenCalled();
    });

    it('should throw when workspace not found', async () => {
      await expect(
        repo.update('nonexistent', { name: 'x' }),
      ).rejects.toThrow('Workspace not found: nonexistent');
    });

    it('should preserve fields not included in changes', async () => {
      const result = await repo.update('local', { name: 'New Name' });

      expect(result.ownerId).toBe('local');
      expect(result.id).toBe('local');
    });
  });
});
