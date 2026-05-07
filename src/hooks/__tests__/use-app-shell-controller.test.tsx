// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFolderRepository, IPromptRepository, ISettingsRepository } from '../../repositories/interfaces';
import { initAppModeStore } from '../../stores/app-mode-store';
import { initFolderStore } from '../../stores/folder-store';
import { initPromptStore } from '../../stores/prompt-store';
import { DEFAULT_SETTINGS, initSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import type { Folder, PromptRecipe } from '../../types/index';
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
  };
}

async function setupStores(initialPrompts: PromptRecipe[] = [makePrompt()]) {
  const promptRepo = createPromptRepo(initialPrompts);
  const promptStore = initPromptStore(promptRepo);
  await promptStore.getState().loadPrompts();

  const folderRepo = createFolderRepo();
  const folderStore = initFolderStore(folderRepo);
  await folderStore.getState().loadFolders();

  const settingsRepo = createSettingsRepo();
  const settingsStore = initSettingsStore(settingsRepo);
  await settingsStore.getState().loadSettings();

  initAppModeStore();
  useToastStore.setState({ toasts: [] });

  return { folderRepo, promptRepo };
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
});
