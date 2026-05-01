import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import type { IPromptRepository } from '../../repositories/interfaces';
import { createPromptStore, type PromptStore } from '../prompt-store';
import type { StoreApi } from 'zustand';

// ─── Mock Repository ───────────────────────────────────────────────────────────

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'p1',
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello {{name}}!',
    tags: ['test'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function createMockRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
  const prompts = [...initialPrompts];

  return {
    getAll: vi.fn(async () => prompts.map((p) => ({ ...p }))),
    create: vi.fn(async (data) => {
      const created: PromptRecipe = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PromptRecipe;
      prompts.push(created);
      return created;
    }),
    update: vi.fn(async (id, changes) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Prompt not found: ${id}`);
      const updated = { ...prompts[idx], ...changes, updatedAt: new Date() };
      prompts[idx] = updated;
      return updated;
    }),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => {
      const original = prompts.find((p) => p.id === id);
      if (!original) throw new Error(`Prompt not found: ${id}`);
      const dup: PromptRecipe = {
        ...original,
        id: crypto.randomUUID(),
        title: `Copy of ${original.title}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prompts.push(dup);
      return dup;
    }),
    toggleFavorite: vi.fn(async (id) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Prompt not found: ${id}`);
      prompts[idx] = { ...prompts[idx], favorite: !prompts[idx].favorite };
      return prompts[idx];
    }),
    getById: vi.fn(async (id) => prompts.find((p) => p.id === id) ?? null),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PromptStore', () => {
  let repo: IPromptRepository;
  let store: StoreApi<PromptStore>;

  const p1 = makePrompt({ id: 'p1', title: 'First Prompt' });
  const p2 = makePrompt({ id: 'p2', title: 'Second Prompt', favorite: true });

  beforeEach(() => {
    repo = createMockRepo([p1, p2]);
    store = createPromptStore(repo);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have empty prompts array', () => {
      expect(store.getState().prompts).toEqual([]);
    });

    it('should default activeWorkspaceId to "local"', () => {
      expect(store.getState().activeWorkspaceId).toBe('local');
    });

    it('should default selectedPromptId to null', () => {
      expect(store.getState().selectedPromptId).toBeNull();
    });

    it('should default searchQuery to empty string', () => {
      expect(store.getState().searchQuery).toBe('');
    });

    it('should default folderFilter to null', () => {
      expect(store.getState().folderFilter).toBeNull();
    });

    it('should default favoriteFilter to false', () => {
      expect(store.getState().favoriteFilter).toBe(false);
    });
  });

  // ── loadPrompts ────────────────────────────────────────────────────────────

  describe('loadPrompts', () => {
    it('should load prompts from the repository', async () => {
      await store.getState().loadPrompts();
      expect(repo.getAll).toHaveBeenCalledWith('local');
      expect(store.getState().prompts).toHaveLength(2);
    });

    it('should replace existing prompts on reload', async () => {
      await store.getState().loadPrompts();
      expect(store.getState().prompts).toHaveLength(2);

      // Load again — should still be 2, not 4
      await store.getState().loadPrompts();
      expect(store.getState().prompts).toHaveLength(2);
    });

    it('should prefer reloadAll when the repository supports cache refreshes', async () => {
      const refreshed = makePrompt({ id: 'fresh', title: 'Fresh Prompt' });
      const refreshableRepo = {
        ...createMockRepo([p1]),
        reloadAll: vi.fn(async () => [refreshed]),
      };
      store = createPromptStore(refreshableRepo);

      await store.getState().loadPrompts();

      expect(refreshableRepo.reloadAll).toHaveBeenCalledWith('local');
      expect(refreshableRepo.getAll).not.toHaveBeenCalled();
      expect(store.getState().prompts).toEqual([refreshed]);
    });
  });

  // ── createPrompt ───────────────────────────────────────────────────────────

  describe('createPrompt', () => {
    it('should create a prompt and add it to the store', async () => {
      await store.getState().loadPrompts();
      const before = store.getState().prompts.length;

      await store.getState().createPrompt({
        workspaceId: 'local',
        title: 'New Prompt',
        description: 'desc',
        body: 'body',
        tags: [],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      });

      expect(store.getState().prompts).toHaveLength(before + 1);
      expect(repo.create).toHaveBeenCalled();
    });

    it('should call repo.create with the provided data', async () => {
      const data = {
        workspaceId: 'local',
        title: 'Created',
        description: '',
        body: 'body text',
        tags: ['tag1'],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      };

      await store.getState().createPrompt(data);
      expect(repo.create).toHaveBeenCalledWith(data);
    });
  });

  // ── updatePrompt ───────────────────────────────────────────────────────────

  describe('updatePrompt', () => {
    it('should update a prompt in the store', async () => {
      await store.getState().loadPrompts();
      await store.getState().updatePrompt('p1', { title: 'Updated Title' });

      const updated = store.getState().prompts.find((p) => p.id === 'p1');
      expect(updated?.title).toBe('Updated Title');
      expect(repo.update).toHaveBeenCalledWith('p1', { title: 'Updated Title' });
    });

    it('should not affect other prompts', async () => {
      await store.getState().loadPrompts();
      await store.getState().updatePrompt('p1', { title: 'Changed' });

      const other = store.getState().prompts.find((p) => p.id === 'p2');
      expect(other?.title).toBe('Second Prompt');
    });
  });

  // ── deletePrompt ───────────────────────────────────────────────────────────

  describe('deletePrompt', () => {
    it('should remove the prompt from the store', async () => {
      await store.getState().loadPrompts();
      await store.getState().deletePrompt('p1');

      expect(store.getState().prompts.find((p) => p.id === 'p1')).toBeUndefined();
      expect(repo.softDelete).toHaveBeenCalledWith('p1');
    });

    it('should clear selectedPromptId if the deleted prompt was selected', async () => {
      await store.getState().loadPrompts();
      store.setState({ selectedPromptId: 'p1' });

      await store.getState().deletePrompt('p1');
      expect(store.getState().selectedPromptId).toBeNull();
    });

    it('should not clear selectedPromptId if a different prompt was deleted', async () => {
      await store.getState().loadPrompts();
      store.setState({ selectedPromptId: 'p2' });

      await store.getState().deletePrompt('p1');
      expect(store.getState().selectedPromptId).toBe('p2');
    });
  });

  // ── duplicatePrompt ────────────────────────────────────────────────────────

  describe('duplicatePrompt', () => {
    it('should add a duplicated prompt to the store', async () => {
      await store.getState().loadPrompts();
      const before = store.getState().prompts.length;

      await store.getState().duplicatePrompt('p1');

      expect(store.getState().prompts).toHaveLength(before + 1);
      expect(repo.duplicate).toHaveBeenCalledWith('p1');

      const dup = store.getState().prompts.find((p) => p.title === 'Copy of First Prompt');
      expect(dup).toBeDefined();
      expect(dup?.id).not.toBe('p1');
    });
  });

  // ── toggleFavorite ─────────────────────────────────────────────────────────

  describe('toggleFavorite', () => {
    it('should toggle the favorite flag in the store', async () => {
      await store.getState().loadPrompts();

      // p1 starts as favorite: false
      await store.getState().toggleFavorite('p1');
      expect(store.getState().prompts.find((p) => p.id === 'p1')?.favorite).toBe(true);
      expect(repo.toggleFavorite).toHaveBeenCalledWith('p1');
    });
  });

  // ── archivePrompt ──────────────────────────────────────────────────────────

  describe('archivePrompt', () => {
    it('should remove the prompt from the store and call softDelete', async () => {
      await store.getState().loadPrompts();
      await store.getState().archivePrompt('p1');

      expect(store.getState().prompts.find((p) => p.id === 'p1')).toBeUndefined();
      expect(repo.softDelete).toHaveBeenCalledWith('p1');
    });

    it('should clear selectedPromptId if the archived prompt was selected', async () => {
      await store.getState().loadPrompts();
      store.setState({ selectedPromptId: 'p1' });

      await store.getState().archivePrompt('p1');
      expect(store.getState().selectedPromptId).toBeNull();
    });
  });

  // ── restorePrompt ──────────────────────────────────────────────────────────

  describe('restorePrompt', () => {
    it('should call repo.restore and reload prompts', async () => {
      await store.getState().loadPrompts();
      await store.getState().restorePrompt('p1');

      expect(repo.restore).toHaveBeenCalledWith('p1');
      // getAll is called once for loadPrompts and once for restorePrompt reload
      expect(repo.getAll).toHaveBeenCalledTimes(2);
    });
  });

  // ── setSearchQuery ─────────────────────────────────────────────────────────

  describe('setSearchQuery', () => {
    it('should update the searchQuery state', () => {
      store.getState().setSearchQuery('hello');
      expect(store.getState().searchQuery).toBe('hello');
    });

    it('should allow clearing the search query', () => {
      store.getState().setSearchQuery('something');
      store.getState().setSearchQuery('');
      expect(store.getState().searchQuery).toBe('');
    });
  });

  // ── setFolderFilter ────────────────────────────────────────────────────────

  describe('setFolderFilter', () => {
    it('should update the folderFilter state', () => {
      store.getState().setFolderFilter('folder-1');
      expect(store.getState().folderFilter).toBe('folder-1');
    });

    it('should allow clearing the folder filter', () => {
      store.getState().setFolderFilter('folder-1');
      store.getState().setFolderFilter(null);
      expect(store.getState().folderFilter).toBeNull();
    });
  });

  // ── setFavoriteFilter ──────────────────────────────────────────────────────

  describe('setFavoriteFilter', () => {
    it('should update the favoriteFilter state', () => {
      store.getState().setFavoriteFilter(true);
      expect(store.getState().favoriteFilter).toBe(true);
    });

    it('should allow disabling the favorite filter', () => {
      store.getState().setFavoriteFilter(true);
      store.getState().setFavoriteFilter(false);
      expect(store.getState().favoriteFilter).toBe(false);
    });
  });
});
