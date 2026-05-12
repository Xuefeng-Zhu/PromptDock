import { describe, expect, it, vi } from 'vitest';
import { createAppModeStore } from '../../stores/app-mode-store';
import { createFolderStore } from '../../stores/folder-store';
import { createPromptStore } from '../../stores/prompt-store';
import { createSettingsStore, DEFAULT_SETTINGS } from '../../stores/settings-store';
import { createWorkspaceStore } from '../../stores/workspace-store';
import type {
  IFolderRepository,
  IPromptRepository,
  ISettingsRepository,
  IWorkspaceRepository,
} from '../../repositories/interfaces';
import { ConflictService } from '../conflict-service';
import {
  AppSyncLifecycle,
  type SyncLifecycleService,
} from '../app-sync-lifecycle';
import type {
  AuthResult,
  AuthUser,
  Folder,
  PromptRecipe,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMembership,
} from '../../types/index';

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Prompt',
    description: '',
    body: 'Body',
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

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-1',
    name: 'Folder',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPromptRepository(prompts: PromptRecipe[]) {
  let storedPrompts = prompts;
  return {
    create: vi.fn(async (data) => {
      const prompt = makePrompt({ ...data, id: 'created-prompt' });
      storedPrompts = [...storedPrompts, prompt];
      return prompt;
    }),
    getById: vi.fn(async (id) => storedPrompts.find((prompt) => prompt.id === id) ?? null),
    getAll: vi.fn(async (workspaceId) =>
      storedPrompts.filter((prompt) => prompt.workspaceId === workspaceId),
    ),
    reloadAll: vi.fn(async (workspaceId) =>
      storedPrompts.filter((prompt) => prompt.workspaceId === workspaceId),
    ),
    update: vi.fn(async (id, changes) => {
      const existing = storedPrompts.find((prompt) => prompt.id === id);
      if (!existing) throw new Error(`Prompt not found: ${id}`);
      const updated = { ...existing, ...changes, updatedAt: new Date('2024-01-02T00:00:00.000Z') };
      storedPrompts = storedPrompts.map((prompt) => (prompt.id === id ? updated : prompt));
      return updated;
    }),
    delete: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => makePrompt({ id: `copy-${id}` })),
    toggleFavorite: vi.fn(async (id) => makePrompt({ id, favorite: true })),
    setFirestoreDelegate: vi.fn(),
  } satisfies IPromptRepository & {
    setFirestoreDelegate(delegate: IPromptRepository | null): void;
  };
}

function createFolderRepository(folders: Folder[]) {
  let storedFolders = folders;
  return {
    createFolder: vi.fn(async (name) => {
      const folder = makeFolder({ id: `folder-${name}`, name });
      storedFolders = [...storedFolders, folder];
      return folder;
    }),
    deleteFolder: vi.fn(async (id) => {
      storedFolders = storedFolders.filter((folder) => folder.id !== id);
    }),
    getAllFolders: vi.fn(async () => storedFolders),
    reloadAllFolders: vi.fn(async () => storedFolders),
    setFirestoreDelegate: vi.fn(),
  } satisfies IFolderRepository & {
    setFirestoreDelegate(delegate: IFolderRepository | null): void;
  };
}

function createSettingsRepository(): ISettingsRepository {
  let settings = { ...DEFAULT_SETTINGS };
  return {
    get: vi.fn(async () => settings),
    update: vi.fn(async (changes) => {
      settings = { ...settings, ...changes };
      return settings;
    }),
  };
}

function makeWorkspace(user: AuthUser): Workspace {
  return {
    id: user.uid,
    name: 'Personal Workspace',
    ownerId: user.uid,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

function makeMembership(user: AuthUser): WorkspaceMembership {
  return {
    id: `${user.uid}_${user.uid}`,
    workspaceId: user.uid,
    userId: user.uid,
    role: 'owner',
    email: user.email,
    displayName: user.displayName,
    workspaceName: 'Personal Workspace',
    ownerId: user.uid,
    joinedAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

function makeAuthUser(uid: string): AuthUser {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: null,
  };
}

function createWorkspaceRepository(): IWorkspaceRepository {
  let currentUser: AuthUser | null = null;
  return {
    create: vi.fn(async () => makeWorkspace(currentUser ?? makeAuthUser('local'))),
    getById: vi.fn(async () => (currentUser ? makeWorkspace(currentUser) : null)),
    listForUser: vi.fn(async () => []),
    listSyncedWorkspacesForUser: vi.fn(async () =>
      currentUser ? [makeWorkspace(currentUser)] : [],
    ),
    update: vi.fn(async (_id, changes) => ({
      ...(currentUser ? makeWorkspace(currentUser) : makeWorkspace(makeAuthUser('user-1'))),
      ...changes,
    })),
    updateSyncedWorkspace: vi.fn(async (_id, changes) => ({
      ...(currentUser ? makeWorkspace(currentUser) : makeWorkspace(makeAuthUser('user-1'))),
      ...changes,
    })),
    bootstrapPersonalWorkspace: vi.fn(async (user) => {
      currentUser = user;
      return makeWorkspace(user);
    }),
    listMembershipsForUser: vi.fn(async () =>
      currentUser ? [makeMembership(currentUser)] : [],
    ),
    listPendingInvitesForEmail: vi.fn(async () => [] as WorkspaceInvite[]),
    listMembers: vi.fn(async () =>
      currentUser
        ? [{
            id: currentUser.uid,
            workspaceId: currentUser.uid,
            userId: currentUser.uid,
            role: 'owner',
            email: currentUser.email,
            displayName: currentUser.displayName,
            joinedAt: new Date('2024-01-01T00:00:00.000Z'),
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          } satisfies WorkspaceMember]
        : [],
    ),
    listInvites: vi.fn(async () => [] as WorkspaceInvite[]),
    createSyncedWorkspace: vi.fn(async (name, owner) => {
      const workspace = { ...makeWorkspace(owner), id: 'workspace-new', name };
      const membership = { ...makeMembership(owner), id: `workspace-new_${owner.uid}`, workspaceId: workspace.id, workspaceName: name };
      return { workspace, membership };
    }),
    createInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    acceptInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    deleteSyncedWorkspace: vi.fn(async () => {}),
    leaveSyncedWorkspace: vi.fn(async () => {}),
    updateMemberRole: vi.fn(async () => {
      throw new Error('not used');
    }),
    removeMember: vi.fn(async () => {}),
    revokeInvite: vi.fn(async () => {}),
  };
}

function createFirestoreDelegate(): IPromptRepository & IFolderRepository {
  return {
    ...createPromptRepository([]),
    ...createFolderRepository([]),
  };
}

function createAuthResult(uid = 'user-1'): AuthResult {
  return {
    success: true,
    user: {
      uid,
      email: `${uid}@example.com`,
      displayName: null,
    },
  };
}

async function flushAsync(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

interface HarnessOptions {
  authResult?: AuthResult | null;
  authRejects?: Error;
  firestoreDelegateBeforeTransition?: IPromptRepository & IFolderRepository;
  firestoreDelegateAfterTransition?: IPromptRepository & IFolderRepository;
  transitionRejects?: Error;
}

function createHarness(options: HarnessOptions = {}) {
  const prompts = [makePrompt({ id: 'prompt-local' })];
  const folders = [makeFolder({ id: 'folder-local' })];
  const promptRepository = createPromptRepository(prompts);
  const folderRepository = createFolderRepository(folders);
  const settingsRepository = createSettingsRepository();
  const workspaceRepository = createWorkspaceRepository();
  const appModeStore = createAppModeStore();
  const promptStore = createPromptStore(promptRepository);
  const folderStore = createFolderStore(folderRepository);
  const settingsStore = createSettingsStore(settingsRepository);
  const workspaceStore = createWorkspaceStore(workspaceRepository);
  const conflictService = new ConflictService();
  const clearConflicts = vi.spyOn(conflictService, 'clearAll');
  const logger = { error: vi.fn() };
  const onSyncServiceChange = vi.fn();

  promptStore.setState({ prompts });
  folderStore.setState({ folders });

  let currentFirestoreDelegate = options.firestoreDelegateBeforeTransition ?? null;
  const syncService: SyncLifecycleService = {
    transitionToSynced: vi.fn(async () => {
      if (options.transitionRejects) throw options.transitionRejects;
      currentFirestoreDelegate =
        options.firestoreDelegateAfterTransition ?? currentFirestoreDelegate;
    }),
    getFirestoreBackend: vi.fn(() => currentFirestoreDelegate),
    dispose: vi.fn(),
  };
  const createSyncService = vi.fn(() => syncService);
  const authService = {
    restoreSession: vi.fn(async () => {
      if (options.authRejects) throw options.authRejects;
      return options.authResult ?? null;
    }),
  };

  const lifecycle = new AppSyncLifecycle({
    appModeStore,
    promptStore,
    folderStore,
    settingsStore,
    workspaceStore,
    promptRepository,
    folderRepository,
    authService,
    conflictService,
    syncMigrationChoice: 'migrate',
    createSyncService,
    onSyncServiceChange,
    logger,
  });

  return {
    appModeStore,
    authService,
    clearConflicts,
    createSyncService,
    folderRepository,
    folderStore,
    lifecycle,
    logger,
    onSyncServiceChange,
    promptRepository,
    promptStore,
    settingsRepository,
    settingsStore,
    syncService,
    workspaceRepository,
    workspaceStore,
    prompts,
    folders,
  };
}

describe('AppSyncLifecycle', () => {
  it('restores a valid auth session and starts synced mode', async () => {
    const firestoreDelegate = createFirestoreDelegate();
    const harness = createHarness({
      authResult: createAuthResult('user-1'),
      firestoreDelegateAfterTransition: firestoreDelegate,
    });
    harness.lifecycle.start();

    await harness.lifecycle.restoreAuthSession();
    await flushAsync();

    expect(harness.authService.restoreSession).toHaveBeenCalledTimes(1);
    expect(harness.appModeStore.getState().userId).toBe('user-1');
    expect(harness.appModeStore.getState().mode).toBe('synced');
    expect(harness.createSyncService).toHaveBeenCalledTimes(1);
    expect(harness.promptStore.getState().activeWorkspaceId).toBe('user-1');
    expect(harness.folderStore.getState().activeWorkspaceId).toBe('user-1');
    expect(harness.syncService.transitionToSynced).toHaveBeenCalledWith(
      'user-1',
      'user-1',
      harness.prompts,
      'migrate',
      harness.folders,
    );
    expect(harness.promptRepository.setFirestoreDelegate).toHaveBeenCalledWith(firestoreDelegate);
    expect(harness.folderRepository.setFirestoreDelegate).toHaveBeenCalledWith(firestoreDelegate);
  });

  it('leaves the app in local mode when auth restore fails', async () => {
    const harness = createHarness({ authRejects: new Error('auth unavailable') });
    harness.lifecycle.start();

    await harness.lifecycle.restoreAuthSession();
    await flushAsync();

    expect(harness.appModeStore.getState().mode).toBe('local');
    expect(harness.appModeStore.getState().userId).toBeNull();
    expect(harness.createSyncService).not.toHaveBeenCalled();
  });

  it('tears down sync state and reloads local data on sign-out', async () => {
    const firestoreDelegate = createFirestoreDelegate();
    const harness = createHarness({ firestoreDelegateBeforeTransition: firestoreDelegate });
    const loadPrompts = vi.spyOn(harness.promptStore.getState(), 'loadPrompts');
    const loadFolders = vi.spyOn(harness.folderStore.getState(), 'loadFolders');
    harness.lifecycle.start();
    harness.appModeStore.getState().setUserId('user-1');
    harness.appModeStore.getState().setMode('synced');
    await flushAsync();

    harness.appModeStore.getState().setMode('local');
    await flushAsync();

    expect(harness.syncService.dispose).toHaveBeenCalledTimes(1);
    expect(harness.onSyncServiceChange).toHaveBeenLastCalledWith(null);
    expect(harness.promptRepository.setFirestoreDelegate).toHaveBeenLastCalledWith(null);
    expect(harness.folderRepository.setFirestoreDelegate).toHaveBeenLastCalledWith(null);
    expect(harness.promptStore.getState().activeWorkspaceId).toBe('local');
    expect(harness.folderStore.getState().activeWorkspaceId).toBe('local');
    expect(harness.settingsRepository.update).toHaveBeenLastCalledWith({
      activeWorkspaceId: 'local',
    });
    expect(harness.clearConflicts).toHaveBeenCalledTimes(1);
    expect(loadPrompts).toHaveBeenCalledTimes(1);
    expect(loadFolders).toHaveBeenCalledTimes(1);
  });

  it('cleans up delegates and returns to local mode when synced transition rejects', async () => {
    const firestoreDelegate = createFirestoreDelegate();
    const error = new Error('transition failed');
    const harness = createHarness({
      firestoreDelegateBeforeTransition: firestoreDelegate,
      transitionRejects: error,
    });
    harness.lifecycle.start();

    harness.appModeStore.getState().setUserId('user-1');
    harness.appModeStore.getState().setMode('synced');
    await flushAsync();

    expect(harness.logger.error).toHaveBeenCalledWith(
      'Failed to transition to synced mode:',
      error,
    );
    expect(harness.appModeStore.getState().mode).toBe('local');
    expect(harness.appModeStore.getState().syncStatus).toBe('local');
    expect(harness.syncService.dispose).toHaveBeenCalledTimes(1);
    expect(harness.promptRepository.setFirestoreDelegate).toHaveBeenLastCalledWith(null);
    expect(harness.folderRepository.setFirestoreDelegate).toHaveBeenLastCalledWith(null);
  });

  it('wires Firestore delegates before transition when the sync service already exposes them', async () => {
    const firestoreDelegate = createFirestoreDelegate();
    const harness = createHarness({ firestoreDelegateBeforeTransition: firestoreDelegate });
    harness.lifecycle.start();

    harness.appModeStore.getState().setUserId('user-1');
    harness.appModeStore.getState().setMode('synced');
    await flushAsync();

    expect(harness.promptRepository.setFirestoreDelegate).toHaveBeenCalledWith(firestoreDelegate);
    expect(harness.folderRepository.setFirestoreDelegate).toHaveBeenCalledWith(firestoreDelegate);
    expect(
      vi.mocked(harness.promptRepository.setFirestoreDelegate).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(harness.syncService.transitionToSynced).mock.invocationCallOrder[0],
    );
  });
});
