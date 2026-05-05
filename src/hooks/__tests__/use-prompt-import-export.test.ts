// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { StoreApi } from 'zustand';
import type { IPromptRepository } from '../../repositories/interfaces';
import { initAppModeStore, type AppModeStore } from '../../stores/app-mode-store';
import {
  initPromptStore,
  type CreatePromptData,
  type PromptStore,
} from '../../stores/prompt-store';
import type { PromptRecipe } from '../../types/index';
import { usePromptImportExport } from '../use-prompt-import-export';

const mockSaveFile = vi.fn();
const mockOpenFile = vi.fn();

vi.mock('../../utils/file-dialog', () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
  openFile: () => mockOpenFile(),
}));

interface MockPromptRepo extends IPromptRepository {
  create: Mock<(data: CreatePromptData) => Promise<PromptRecipe>>;
  update: Mock<(id: string, changes: Partial<PromptRecipe>) => Promise<PromptRecipe>>;
}

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: overrides.id ?? 'prompt-1',
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

function createImportJson(
  prompts: Array<{
    body: string;
    description?: string;
    favorite?: boolean;
    folderId?: string | null;
    tags?: string[];
    title: string;
  }>,
): string {
  return JSON.stringify({
    version: '1.0',
    exportedAt: '2024-01-15T12:00:00.000Z',
    prompts,
  });
}

function createMockPromptRepo(seedPrompts: PromptRecipe[] = []): MockPromptRepo {
  const prompts = [...seedPrompts];

  const repo: MockPromptRepo = {
    create: vi.fn(async (data: CreatePromptData) => {
      const created: PromptRecipe = {
        ...data,
        id: `created-${repo.create.mock.calls.length}`,
        createdAt: new Date('2024-01-15T12:00:00.000Z'),
        updatedAt: new Date('2024-01-15T12:00:00.000Z'),
      };
      prompts.push(created);
      return created;
    }),
    duplicate: vi.fn(async (id: string) => {
      const original = prompts.find((prompt) => prompt.id === id);
      if (!original) throw new Error(`Prompt not found: ${id}`);
      return makePrompt({ ...original, id: `copy-${id}` });
    }),
    getAll: vi.fn(async () => prompts),
    getById: vi.fn(async (id: string) => prompts.find((prompt) => prompt.id === id) ?? null),
    restore: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    toggleFavorite: vi.fn(async (id: string) => {
      const prompt = prompts.find((item) => item.id === id);
      if (!prompt) throw new Error(`Prompt not found: ${id}`);
      const updated = { ...prompt, favorite: !prompt.favorite };
      prompts.splice(prompts.indexOf(prompt), 1, updated);
      return updated;
    }),
    update: vi.fn(async (id: string, changes: Partial<PromptRecipe>) => {
      const prompt = prompts.find((item) => item.id === id);
      if (!prompt) throw new Error(`Prompt not found: ${id}`);
      const updated = {
        ...prompt,
        ...changes,
        updatedAt: new Date('2024-01-15T12:00:00.000Z'),
      };
      prompts.splice(prompts.indexOf(prompt), 1, updated);
      return updated;
    }),
  };

  return repo;
}

function setupStores(seedPrompts: PromptRecipe[] = []) {
  const repo = createMockPromptRepo(seedPrompts);
  const promptStore: StoreApi<PromptStore> = initPromptStore(repo);
  const appModeStore: StoreApi<AppModeStore> = initAppModeStore();
  promptStore.setState({
    activeWorkspaceId: 'local',
    prompts: seedPrompts,
  });
  return { appModeStore, promptStore, repo };
}

describe('usePromptImportExport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    mockSaveFile.mockResolvedValue(true);
    mockOpenFile.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('exports only active prompts and reports success after saving', async () => {
    setupStores([
      makePrompt({ id: 'active', title: 'Active prompt' }),
      makePrompt({ id: 'archived', title: 'Archived prompt', archived: true }),
    ]);
    const { result } = renderHook(() => usePromptImportExport());

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockSaveFile).toHaveBeenCalledTimes(1);
    expect(mockSaveFile.mock.calls[0][1]).toBe('promptdock-export-2024-01-15.json');
    expect(JSON.parse(mockSaveFile.mock.calls[0][0] as string).prompts).toEqual([
      expect.objectContaining({ title: 'Active prompt' }),
    ]);
    expect(result.current.successMessage).toBe('Prompts exported successfully.');
  });

  it('imports prompts into the active synced workspace when signed in', async () => {
    const { appModeStore, promptStore, repo } = setupStores();
    appModeStore.setState({ mode: 'synced', userId: 'user-1' });
    promptStore.setState({ activeWorkspaceId: 'workspace-1' });
    mockOpenFile.mockResolvedValue(
      createImportJson([
        {
          title: 'Imported prompt',
          body: 'Hello {{name}}',
          tags: ['welcome'],
        },
      ]),
    );
    const { result } = renderHook(() => usePromptImportExport());

    await act(async () => {
      await result.current.handleImport();
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Hello {{name}}',
        createdBy: 'user-1',
        tags: ['welcome'],
        title: 'Imported prompt',
        workspaceId: 'workspace-1',
      }),
    );
    expect(result.current.successMessage).toBe('Imported 1 prompt(s) successfully.');
  });

  it('pauses duplicate imports and can skip duplicates while importing new prompts', async () => {
    const existing = makePrompt({
      id: 'existing',
      title: 'Existing prompt',
      body: 'Duplicate body',
    });
    const { repo } = setupStores([existing]);
    mockOpenFile.mockResolvedValue(
      createImportJson([
        {
          title: 'Existing prompt',
          body: 'Duplicate body',
        },
        {
          title: 'Fresh prompt',
          body: 'Fresh body',
        },
      ]),
    );
    const { result } = renderHook(() => usePromptImportExport());

    await act(async () => {
      await result.current.handleImport();
    });

    expect(result.current.duplicates).toHaveLength(1);
    expect(repo.create).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSkipAll();
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Fresh body',
        title: 'Fresh prompt',
      }),
    );
    expect(result.current.duplicates).toEqual([]);
    expect(result.current.successMessage).toBe(
      'Imported 1 prompt(s), skipped 1 duplicate(s).',
    );
  });

  it('overwrites duplicates and imports pending non-duplicates', async () => {
    const existing = makePrompt({
      id: 'existing',
      title: 'Existing prompt',
      body: 'Old body',
      tags: ['old'],
    });
    const { repo } = setupStores([existing]);
    mockOpenFile.mockResolvedValue(
      createImportJson([
        {
          title: 'Existing prompt',
          body: 'Updated body',
          tags: ['updated'],
        },
        {
          title: 'Another prompt',
          body: 'Another body',
        },
      ]),
    );
    const { result } = renderHook(() => usePromptImportExport());

    await act(async () => {
      await result.current.handleImport();
    });
    await act(async () => {
      await result.current.handleOverwriteAll();
    });

    expect(repo.update).toHaveBeenCalledWith(
      'existing',
      expect.objectContaining({
        body: 'Updated body',
        tags: ['updated'],
        title: 'Existing prompt',
      }),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Another body',
        title: 'Another prompt',
      }),
    );
    expect(result.current.successMessage).toBe(
      'Imported 2 prompt(s), overwrote 1 duplicate(s).',
    );
  });
});
