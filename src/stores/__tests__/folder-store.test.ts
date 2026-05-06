import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFolderRepository } from '../../repositories/interfaces';
import type { Folder } from '../../types/index';
import { createFolderStore, type FolderStore } from '../folder-store';

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-1',
    name: 'General',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createRepo(): IFolderRepository {
  return {
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
}

describe('FolderStore', () => {
  let repo: IFolderRepository;
  let store: ReturnType<typeof createFolderStore>;

  beforeEach(() => {
    repo = createRepo();
    store = createFolderStore(repo);
  });

  it('loads folders for the active workspace', async () => {
    store.getState().setActiveWorkspaceId('workspace-a');

    await store.getState().loadFolders();

    expect(store.getState().folders).toEqual([
      expect.objectContaining({ id: 'folder-a', name: 'Workspace A' }),
    ]);
    expect(repo.reloadAllFolders).toHaveBeenCalledWith('workspace-a');
  });

  it('creates folders in the active workspace and upserts duplicate ids', async () => {
    store.setState({
      activeWorkspaceId: 'workspace-b',
      folders: [makeFolder({ id: 'workspace-b-Design', name: 'Design' })],
    } satisfies Partial<FolderStore>);

    await store.getState().createFolder('Design');

    expect(repo.createFolder).toHaveBeenCalledWith('Design', 'workspace-b');
    expect(store.getState().folders).toHaveLength(1);
    expect(store.getState().folders[0]).toEqual(
      expect.objectContaining({ id: 'workspace-b-Design', name: 'Design' }),
    );
  });
});
