// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFolderRepository, IStorageBackend } from '../interfaces';
import { FolderRepository } from '../folder-repository';
import type { Folder, PromptRecipe, UserSettings, Workspace } from '../../types/index';

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-existing',
    name: 'Existing',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createMockBackend(initialFolders: Folder[] = []): IStorageBackend {
  let folders = [...initialFolders];

  return {
    initialize: vi.fn(async () => {}),
    readPrompts: vi.fn(async () => [] as PromptRecipe[]),
    writePrompts: vi.fn(async () => {}),
    readFolders: vi.fn(async () => folders.map((folder) => ({ ...folder }))),
    writeFolders: vi.fn(async (nextFolders: Folder[]) => {
      folders = nextFolders.map((folder) => ({ ...folder }));
    }),
    readSettings: vi.fn(async () => ({
      hotkeyCombo: 'CommandOrControl+Shift+P',
      theme: 'system',
      defaultAction: 'copy',
      activeWorkspaceId: 'local',
    } satisfies UserSettings)),
    writeSettings: vi.fn(async () => {}),
    readWorkspace: vi.fn(async () => ({
      id: 'local',
      name: 'Local',
      ownerId: 'local',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } satisfies Workspace)),
    writeWorkspace: vi.fn(async () => {}),
  };
}

describe('FolderRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates folders through the configured storage backend', async () => {
    const backend = createMockBackend();
    const repo = new FolderRepository(backend);

    const folder = await repo.createFolder('Client Work', 'local');

    expect(folder.name).toBe('Client Work');
    expect(folder.id).toMatch(/^folder-client-work-/);
    expect(backend.writeFolders).toHaveBeenCalledWith([expect.objectContaining({
      id: folder.id,
      name: 'Client Work',
    })]);
    expect(localStorage.getItem('promptdock_folders')).toBeNull();
  });

  it('returns the existing folder for duplicate normalized names', async () => {
    const existing = makeFolder({ id: 'folder-client-work', name: 'Client Work' });
    const backend = createMockBackend([existing]);
    const repo = new FolderRepository(backend);

    const folder = await repo.createFolder('  client   work  ', 'local');

    expect(folder).toEqual(existing);
    expect(backend.writeFolders).not.toHaveBeenCalled();
  });

  it('reloads folders from the backend', async () => {
    const backend = createMockBackend([makeFolder({ id: 'folder-a', name: 'A' })]);
    const repo = new FolderRepository(backend);

    const folders = await repo.reloadAllFolders('local');

    expect(folders.map((folder) => folder.name)).toEqual(['A']);
    expect(backend.readFolders).toHaveBeenCalledTimes(1);
  });

  it('delegates synced folder reads and writes by active workspace', async () => {
    const backend = createMockBackend();
    const syncedRepo: IFolderRepository = {
      getAllFolders: vi.fn(async (workspaceId) =>
        workspaceId === 'workspace-a'
          ? [makeFolder({ id: 'folder-a', name: 'Workspace A' })]
          : [makeFolder({ id: 'folder-b', name: 'Workspace B' })],
      ),
      reloadAllFolders: vi.fn(async (workspaceId) =>
        workspaceId === 'workspace-a'
          ? [makeFolder({ id: 'folder-a', name: 'Workspace A' })]
          : [makeFolder({ id: 'folder-b', name: 'Workspace B' })],
      ),
      createFolder: vi.fn(async (name, workspaceId) =>
        makeFolder({ id: `${workspaceId}-${name}`, name }),
      ),
    };
    const repo = new FolderRepository(backend);
    repo.setFirestoreDelegate(syncedRepo);

    await expect(repo.getAllFolders('workspace-a')).resolves.toEqual([
      expect.objectContaining({ name: 'Workspace A' }),
    ]);
    await expect(repo.createFolder('Design', 'workspace-b')).resolves.toEqual(
      expect.objectContaining({ id: 'workspace-b-Design' }),
    );

    expect(syncedRepo.getAllFolders).toHaveBeenCalledWith('workspace-a');
    expect(syncedRepo.createFolder).toHaveBeenCalledWith('Design', 'workspace-b');
    expect(backend.writeFolders).not.toHaveBeenCalled();
  });
});
