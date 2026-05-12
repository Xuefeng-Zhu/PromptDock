// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  IFolderRepository,
  IPromptRepository,
  ISettingsRepository,
  IWorkspaceRepository,
} from '../../repositories/interfaces';
import { initAppModeStore } from '../../stores/app-mode-store';
import { initFolderStore } from '../../stores/folder-store';
import { initPromptStore } from '../../stores/prompt-store';
import { DEFAULT_SETTINGS, initSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { initWorkspaceStore } from '../../stores/workspace-store';
import type { Folder, PromptRecipe, Workspace, WorkspaceMembership } from '../../types/index';
import { useAppShellController } from '../use-app-shell-controller';

vi.mock('../../App', () => ({
  getConflictService: () => null,
}));

vi.mock('../../services/analytics-service', () => ({
  trackPromptAction: vi.fn(),
  trackScreenView: vi.fn(),
}));

vi.mock('../../utils/window', () => ({
  hideMainWindow: vi.fn(async () => {}),
}));

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Existing prompt',
    description: '',
    body: 'Hello world',
    tags: [],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function createPromptRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
  let prompts = [...initialPrompts];

  return {
    getAll: vi.fn(async () => prompts.map((prompt) => ({ ...prompt }))),
    getById: vi.fn(async (id) => prompts.find((prompt) => prompt.id === id) ?? null),
    create: vi.fn(async (data) => {
      const created: PromptRecipe = {
        ...data,
        id: 'created-prompt',
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };
      prompts = [...prompts, created];
      return created;
    }),
    update: vi.fn(async (id, changes) => {
      const existing = prompts.find((prompt) => prompt.id === id);
      if (!existing) throw new Error(`Prompt not found: ${id}`);
      const updated = { ...existing, ...changes, updatedAt: new Date('2024-01-03T00:00:00.000Z') };
      prompts = prompts.map((prompt) => (prompt.id === id ? updated : prompt));
      return updated;
    }),
    delete: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => makePrompt({ id: `copy-${id}` })),
    duplicateToWorkspace: vi.fn(async (id, target) => makePrompt({
      id: `copy-${id}`,
      workspaceId: target.workspaceId,
      title: 'Copy of Existing prompt',
      folderId: null,
      createdBy: target.createdBy,
      favorite: false,
      archived: false,
      archivedAt: null,
      lastUsedAt: null,
      version: 1,
    })),
    toggleFavorite: vi.fn(async (id) => makePrompt({ id, favorite: true })),
  };
}

function createSettingsRepo(): ISettingsRepository {
  return {
    get: vi.fn(async () => ({ ...DEFAULT_SETTINGS })),
    update: vi.fn(async (changes) => ({ ...DEFAULT_SETTINGS, ...changes })),
  };
}

function createFolderRepo(initialFolders: Folder[] = []): IFolderRepository {
  const folders = [...initialFolders];

  return {
    getAllFolders: vi.fn(async () => folders.map((folder) => ({ ...folder }))),
    reloadAllFolders: vi.fn(async () => folders.map((folder) => ({ ...folder }))),
    createFolder: vi.fn(async (name) => {
      const existing = folders.find((folder) => folder.name.toLowerCase() === name.trim().toLowerCase());
      if (existing) return { ...existing };

      const folder: Folder = {
        id: `folder-${name.trim().toLowerCase().replace(/\s+/g, '-')}`,
        name: name.trim(),
        createdAt: new Date('2024-01-04T00:00:00.000Z'),
        updatedAt: new Date('2024-01-04T00:00:00.000Z'),
      };
      folders.push(folder);
      return folder;
    }),
    deleteFolder: vi.fn(async (id) => {
      const index = folders.findIndex((folder) => folder.id === id);
      if (index === -1) {
        throw new Error(`Folder not found: ${id}`);
      }

      folders.splice(index, 1);
    }),
  };
}

function createWorkspaceRepo(): IWorkspaceRepository {
  const localWorkspace: Workspace = {
    id: 'local',
    name: 'My Prompts',
    ownerId: 'local',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  return {
    create: vi.fn(async () => localWorkspace),
    getById: vi.fn(async () => localWorkspace),
    listForUser: vi.fn(async () => [localWorkspace]),
    listSyncedWorkspacesForUser: vi.fn(async () => [localWorkspace]),
    update: vi.fn(async (_id, changes) => ({ ...localWorkspace, ...changes })),
    updateSyncedWorkspace: vi.fn(async (_id, changes) => ({ ...localWorkspace, ...changes })),
    bootstrapPersonalWorkspace: vi.fn(async () => localWorkspace),
    listMembershipsForUser: vi.fn(async () => []),
    listPendingInvitesForEmail: vi.fn(async () => []),
    listMembers: vi.fn(async () => []),
    listInvites: vi.fn(async () => []),
    createSyncedWorkspace: vi.fn(async () => {
      throw new Error('Not implemented');
    }),
    createInvite: vi.fn(async () => {
      throw new Error('Not implemented');
    }),
    acceptInvite: vi.fn(async () => {
      throw new Error('Not implemented');
    }),
    deleteSyncedWorkspace: vi.fn(async () => {}),
    leaveSyncedWorkspace: vi.fn(async () => {}),
    updateMemberRole: vi.fn(async () => {
      throw new Error('Not implemented');
    }),
    removeMember: vi.fn(async () => {}),
    revokeInvite: vi.fn(async () => {}),
  };
}

async function setupStores(
  initialPrompts: PromptRecipe[] = [makePrompt()],
  initialFolders: Folder[] = [],
) {
  const promptRepo = createPromptRepo(initialPrompts);
  const promptStore = initPromptStore(promptRepo);
  await promptStore.getState().loadPrompts();

  const folderRepo = createFolderRepo(initialFolders);
  const folderStore = initFolderStore(folderRepo);
  await folderStore.getState().loadFolders();

  const settingsRepo = createSettingsRepo();
  const settingsStore = initSettingsStore(settingsRepo);
  await settingsStore.getState().loadSettings();

  const appModeStore = initAppModeStore();
  const workspaceStore = initWorkspaceStore(createWorkspaceRepo());
  useToastStore.setState({ toasts: [] });

  return { appModeStore, folderRepo, promptRepo, promptStore, workspaceStore };
}

describe('useAppShellController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('promptdock_onboarding_complete', 'true');
  });

  it('blocks shell navigation while the editor has unsaved changes', async () => {
    await setupStores();
    const { result, unmount } = renderHook(() => useAppShellController({}));

    expect(result.current.screen.name).toBe('library');

    act(() => {
      result.current.handleNewPrompt();
    });
    expect(result.current.screen.name).toBe('editor');

    act(() => {
      result.current.setEditorHasUnsavedChanges(true);
    });
    act(() => {
      result.current.handleSettingsOpen();
    });

    expect(result.current.screen.name).toBe('editor');
    const toasts = useToastStore.getState().toasts;
    expect(toasts[toasts.length - 1]?.message).toBe(
      'Save or cancel your prompt changes before leaving the editor.',
    );

    act(() => {
      result.current.setEditorHasUnsavedChanges(false);
    });
    act(() => {
      result.current.handleSettingsOpen();
    });

    expect(result.current.screen.name).toBe('settings');
    unmount();
  });

  it('opens settings directly to workspace sharing', async () => {
    await setupStores();
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleWorkspaceSettingsOpen();
    });

    expect(result.current.screen).toEqual({
      name: 'settings',
      section: 'workspaces-sharing',
    });
    unmount();
  });

  it('saves a new prompt through the prompt store and returns to the library', async () => {
    const { promptRepo } = await setupStores([]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleNewPrompt();
    });

    await act(async () => {
      await result.current.handleEditorSave({
        title: '  New prompt  ',
        description: 'Draft',
        body: 'Hello {{name}}',
        tags: ['draft'],
        folderId: null,
        favorite: true,
      });
    });

    expect(promptRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '  New prompt  ',
        description: 'Draft',
        body: 'Hello {{name}}',
        tags: ['draft'],
        folderId: null,
        favorite: true,
        workspaceId: 'local',
        createdBy: 'local',
      }),
    );
    expect(result.current.screen.name).toBe('library');
    expect(result.current.prompts.map((prompt) => prompt.id)).toContain('created-prompt');
    unmount();
  });

  it('creates folders through the folder repository-backed store', async () => {
    const { folderRepo } = await setupStores([]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    await act(async () => {
      const folder = await result.current.handleCreateFolder('Client Work');
      expect(folder?.name).toBe('Client Work');
    });

    expect(folderRepo.createFolder).toHaveBeenCalledWith('Client Work', 'local');
    expect(result.current.libraryData.derivedFolders.map((folder) => folder.name)).toContain(
      'Client Work',
    );
    expect(localStorage.getItem('promptdock_folders')).toBeNull();
    unmount();
  });

  it('opens duplicate target flow and duplicates into the selected workspace', async () => {
    const { promptRepo } = await setupStores([makePrompt({ folderId: 'folder-a', favorite: true })]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDuplicatePrompt('prompt-1');
    });

    expect(result.current.duplicateDialogPrompt?.id).toBe('prompt-1');
    expect(result.current.duplicateWorkspaceTargets.map((target) => target.workspace.id)).toEqual(['local']);

    await act(async () => {
      await result.current.handleDuplicatePromptConfirm('local');
    });

    expect(promptRepo.duplicateToWorkspace).toHaveBeenCalledWith('prompt-1', {
      workspaceId: 'local',
      createdBy: 'local',
    });
    expect(result.current.duplicateDialogPrompt).toBeNull();
    unmount();
  });

  it('allows a source viewer to duplicate into an editable target workspace', async () => {
    const sourceWorkspace: Workspace = {
      id: 'source-workspace',
      name: 'Source',
      ownerId: 'owner-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
    const editableWorkspace: Workspace = {
      id: 'editable-workspace',
      name: 'Editable',
      ownerId: 'owner-2',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
    const viewerWorkspace: Workspace = {
      id: 'viewer-workspace',
      name: 'Viewer',
      ownerId: 'owner-3',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
    const memberships: WorkspaceMembership[] = [
      {
        id: 'source-user-1',
        workspaceId: sourceWorkspace.id,
        userId: 'user-1',
        role: 'viewer',
        email: 'user@example.com',
        displayName: null,
        workspaceName: sourceWorkspace.name,
        ownerId: sourceWorkspace.ownerId,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 'editable-user-1',
        workspaceId: editableWorkspace.id,
        userId: 'user-1',
        role: 'editor',
        email: 'user@example.com',
        displayName: null,
        workspaceName: editableWorkspace.name,
        ownerId: editableWorkspace.ownerId,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 'viewer-user-1',
        workspaceId: viewerWorkspace.id,
        userId: 'user-1',
        role: 'viewer',
        email: 'user@example.com',
        displayName: null,
        workspaceName: viewerWorkspace.name,
        ownerId: viewerWorkspace.ownerId,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
    const { appModeStore, promptRepo, workspaceStore } = await setupStores([
      makePrompt({ workspaceId: sourceWorkspace.id }),
    ]);
    appModeStore.setState({
      mode: 'synced',
      syncStatus: 'synced',
      userId: 'user-1',
      userEmail: 'user@example.com',
      userDisplayName: null,
    });
    workspaceStore.setState({
      activeWorkspaceId: sourceWorkspace.id,
      currentRole: 'viewer',
      memberships,
      workspaces: [sourceWorkspace, editableWorkspace, viewerWorkspace],
    });

    const { result, unmount } = renderHook(() => useAppShellController({}));

    expect(result.current.canEditWorkspace).toBe(false);
    expect(result.current.duplicateWorkspaceTargets.map((target) => target.workspace.id)).toEqual([
      editableWorkspace.id,
    ]);

    act(() => {
      result.current.handleDuplicatePrompt('prompt-1');
    });
    await act(async () => {
      await result.current.handleDuplicatePromptConfirm(editableWorkspace.id);
    });

    expect(promptRepo.duplicateToWorkspace).toHaveBeenCalledWith('prompt-1', {
      workspaceId: editableWorkspace.id,
      createdBy: 'user-1',
    });
    unmount();
  });

  it('deletes an empty folder without updating prompts', async () => {
    const folder: Folder = {
      id: 'folder-empty',
      name: 'Empty',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const { folderRepo, promptRepo } = await setupStores([makePrompt()], [folder]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDeleteFolder(folder);
    });

    expect(result.current.folderDeleteConfirmation).toEqual({ folder, promptCount: 0 });
    expect(folderRepo.deleteFolder).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleFolderDeleteConfirm();
    });

    expect(promptRepo.update).not.toHaveBeenCalled();
    expect(folderRepo.deleteFolder).toHaveBeenCalledWith('folder-empty', 'local');
    expect(result.current.folderDeleteConfirmation).toBeNull();
    expect(result.current.libraryData.derivedFolders.some((item) => item.id === 'folder-empty')).toBe(false);

    unmount();
  });

  it('deletes a folder with prompts by moving them to no folder', async () => {
    const folder: Folder = {
      id: 'folder-client',
      name: 'Client',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const prompt = makePrompt({ id: 'prompt-foldered', folderId: folder.id });
    const { folderRepo, promptRepo } = await setupStores([prompt], [folder]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDeleteFolder(folder);
    });

    expect(result.current.folderDeleteConfirmation).toEqual({ folder, promptCount: 1 });
    expect(promptRepo.update).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleFolderDeleteConfirm();
    });

    expect(promptRepo.update).toHaveBeenCalledWith('prompt-foldered', { folderId: null });
    expect(folderRepo.deleteFolder).toHaveBeenCalledWith('folder-client', 'local');
    expect(
      vi.mocked(promptRepo.update).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(folderRepo.deleteFolder).mock.invocationCallOrder[0]);
    expect(result.current.prompts.find((item) => item.id === 'prompt-foldered')?.folderId).toBeNull();
    expect(result.current.libraryData.derivedFolders.some((item) => item.id === 'folder-client')).toBe(false);

    unmount();
  });

  it('keeps the folder record when moving prompts out of the folder fails', async () => {
    const folder: Folder = {
      id: 'folder-client',
      name: 'Client',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const prompt = makePrompt({ id: 'prompt-foldered', folderId: folder.id });
    const { folderRepo, promptRepo } = await setupStores([prompt], [folder]);
    vi.mocked(promptRepo.update).mockRejectedValueOnce(new Error('Offline'));
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDeleteFolder(folder);
    });

    await act(async () => {
      await result.current.handleFolderDeleteConfirm();
    });

    expect(promptRepo.update).toHaveBeenCalledWith('prompt-foldered', { folderId: null });
    expect(folderRepo.deleteFolder).not.toHaveBeenCalled();
    expect(
      result.current.libraryData.derivedFolders.some((item) => item.id === 'folder-client'),
    ).toBe(true);
    const toasts = useToastStore.getState().toasts;
    expect(toasts[toasts.length - 1]?.message).toBe('Failed to delete folder: Offline');

    unmount();
  });

  it('restores prompt folder assignments when persisted folder deletion fails', async () => {
    const folder: Folder = {
      id: 'folder-client',
      name: 'Client',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const prompt = makePrompt({ id: 'prompt-foldered', folderId: folder.id });
    const { folderRepo, promptRepo } = await setupStores([prompt], [folder]);
    vi.mocked(folderRepo.deleteFolder).mockRejectedValueOnce(new Error('Store write failed'));
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDeleteFolder(folder);
    });

    await act(async () => {
      await result.current.handleFolderDeleteConfirm();
    });

    expect(promptRepo.update).toHaveBeenNthCalledWith(1, 'prompt-foldered', { folderId: null });
    expect(folderRepo.deleteFolder).toHaveBeenCalledWith('folder-client', 'local');
    expect(promptRepo.update).toHaveBeenNthCalledWith(2, 'prompt-foldered', {
      folderId: 'folder-client',
    });
    expect(
      vi.mocked(folderRepo.deleteFolder).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(promptRepo.update).mock.invocationCallOrder[1]);
    expect(result.current.prompts.find((item) => item.id === 'prompt-foldered')?.folderId).toBe(
      'folder-client',
    );
    expect(result.current.libraryData.derivedFolders.some((item) => item.id === 'folder-client')).toBe(true);
    const toasts = useToastStore.getState().toasts;
    expect(toasts[toasts.length - 1]?.message).toBe(
      'Failed to delete folder: Store write failed',
    );

    unmount();
  });

  it('does not delete folders while the editor has unsaved changes', async () => {
    const folder: Folder = {
      id: 'folder-client',
      name: 'Client',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const prompt = makePrompt({ id: 'prompt-foldered', folderId: folder.id });
    const { folderRepo, promptRepo } = await setupStores([prompt], [folder]);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleEditPrompt('prompt-foldered');
    });
    act(() => {
      result.current.setEditorHasUnsavedChanges(true);
    });

    act(() => {
      result.current.handleDeleteFolder(folder);
    });

    expect(result.current.folderDeleteConfirmation).toBeNull();
    expect(folderRepo.deleteFolder).not.toHaveBeenCalled();
    expect(promptRepo.update).not.toHaveBeenCalled();
    const toasts = useToastStore.getState().toasts;
    expect(toasts[toasts.length - 1]?.message).toBe(
      'Save or cancel your prompt changes before leaving the editor.',
    );

    unmount();
  });

  it('clears derived folder assignments without deleting a missing folder record', async () => {
    const derivedFolder: Folder = {
      id: 'folder-imported',
      name: 'Imported',
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
      updatedAt: new Date('2024-01-04T00:00:00.000Z'),
    };
    const prompt = makePrompt({ id: 'prompt-derived', folderId: derivedFolder.id });
    const { folderRepo, promptRepo } = await setupStores([prompt], []);
    const { result, unmount } = renderHook(() => useAppShellController({}));

    act(() => {
      result.current.handleDeleteFolder(derivedFolder);
    });

    await act(async () => {
      await result.current.handleFolderDeleteConfirm();
    });

    expect(folderRepo.deleteFolder).not.toHaveBeenCalled();
    expect(promptRepo.update).toHaveBeenCalledWith('prompt-derived', { folderId: null });
    expect(result.current.prompts.find((item) => item.id === 'prompt-derived')?.folderId).toBeNull();
    expect(result.current.libraryData.derivedFolders.some((item) => item.id === 'folder-imported')).toBe(false);

    unmount();
  });
});
