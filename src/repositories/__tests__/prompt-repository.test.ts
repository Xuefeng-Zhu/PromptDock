import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { PromptRecipe } from '../../types/index';
import { PromptRepository } from '../prompt-repository';
import type { LocalStorageBackend } from '../local-storage-backend';

// ─── Mock LocalStorageBackend ──────────────────────────────────────────────────

function createMockBackend(): LocalStorageBackend {
  let stored: PromptRecipe[] = [];

  return {
    readPrompts: vi.fn(async () => stored.map((p) => ({ ...p }))),
    writePrompts: vi.fn(async (prompts: PromptRecipe[]) => {
      stored = prompts.map((p) => ({ ...p }));
    }),
  } as unknown as LocalStorageBackend;
}

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function makePromptRecipe(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'test-id-1',
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt recipe',
    body: 'Hello {{name}}, welcome to {{place}}!',
    tags: ['test', 'greeting'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    lastUsedAt: new Date('2024-01-03T00:00:00.000Z'),
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PromptRepository', () => {
  let backend: LocalStorageBackend;
  let repo: PromptRepository;

  beforeEach(() => {
    backend = createMockBackend();
    repo = new PromptRepository(backend);
  });

  describe('create', () => {
    it('should create a new prompt with generated id and timestamps', async () => {
      const input = {
        workspaceId: 'local',
        title: 'New Prompt',
        description: 'A new prompt',
        body: 'Hello {{name}}!',
        tags: ['new'],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      };

      const result = await repo.create(input);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.title).toBe('New Prompt');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdBy).toBe('local');
      expect(result.version).toBe(1);
    });

    it('should persist the created prompt to the backend', async () => {
      await repo.create({
        workspaceId: 'local',
        title: 'Persisted',
        description: '',
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

      expect(backend.writePrompts).toHaveBeenCalled();
    });

    it('should set createdBy to local', async () => {
      const result = await repo.create({
        workspaceId: 'local',
        title: 'Test',
        description: '',
        body: '',
        tags: [],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        lastUsedAt: null,
        createdBy: 'someone-else',
        version: 99,
      });

      expect(result.createdBy).toBe('local');
      expect(result.version).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return the prompt when it exists', async () => {
      const prompt = makePromptRecipe({ id: 'find-me' });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([prompt]);

      const result = await repo.getById('find-me');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('find-me');
    });

    it('should return null when prompt does not exist', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const result = await repo.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return prompts filtered by workspaceId', async () => {
      const prompts = [
        makePromptRecipe({ id: 'p1', workspaceId: 'local' }),
        makePromptRecipe({ id: 'p2', workspaceId: 'other' }),
        makePromptRecipe({ id: 'p3', workspaceId: 'local' }),
      ];
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce(prompts);

      const result = await repo.getAll('local');
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['p1', 'p3']);
    });

    it('should return empty array when no prompts match', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const result = await repo.getAll('local');
      expect(result).toEqual([]);
    });

    it('reloadAll should refresh cached prompts from the backend', async () => {
      const first = makePromptRecipe({ id: 'first', title: 'First' });
      const second = makePromptRecipe({ id: 'second', title: 'Second' });
      (backend.readPrompts as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([first])
        .mockResolvedValueOnce([second]);

      await repo.getAll('local');
      const result = await repo.reloadAll('local');

      expect(result.map((p) => p.id)).toEqual(['second']);
      expect(backend.readPrompts).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update the prompt and set updatedAt', async () => {
      const original = makePromptRecipe({
        id: 'update-me',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        version: 1,
      });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const before = new Date();
      const result = await repo.update('update-me', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.version).toBe(2);
    });

    it('should increment version on each update', async () => {
      const original = makePromptRecipe({ id: 'v-test', version: 5 });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const result = await repo.update('v-test', { description: 'new desc' });
      expect(result.version).toBe(6);
    });

    it('should not allow id to be overwritten', async () => {
      const original = makePromptRecipe({ id: 'keep-id' });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const result = await repo.update('keep-id', { id: 'new-id' } as Partial<PromptRecipe>);
      expect(result.id).toBe('keep-id');
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.update('nonexistent', { title: 'x' })).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });

    it('should persist the updated prompt to the backend', async () => {
      const original = makePromptRecipe({ id: 'persist-test' });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      await repo.update('persist-test', { title: 'Updated' });
      expect(backend.writePrompts).toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should set archived to true and archivedAt to a timestamp', async () => {
      const original = makePromptRecipe({
        id: 'archive-me',
        archived: false,
        archivedAt: null,
      });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const before = new Date();
      await repo.softDelete('archive-me');

      // Read back from the backend to verify
      const written = (backend.writePrompts as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const archived = written.find((p: PromptRecipe) => p.id === 'archive-me');

      expect(archived.archived).toBe(true);
      expect(archived.archivedAt).toBeInstanceOf(Date);
      expect(archived.archivedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.softDelete('nonexistent')).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });
  });

  describe('delete', () => {
    it('should permanently remove the prompt from storage', async () => {
      const removed = makePromptRecipe({ id: 'delete-me' });
      const kept = makePromptRecipe({ id: 'keep-me' });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([removed, kept]);

      await repo.delete('delete-me');

      const written = (backend.writePrompts as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(written.map((p: PromptRecipe) => p.id)).toEqual(['keep-me']);
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.delete('nonexistent')).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });
  });

  describe('restore', () => {
    it('should set archived to false and archivedAt to null', async () => {
      const original = makePromptRecipe({
        id: 'restore-me',
        archived: true,
        archivedAt: new Date('2024-06-01T00:00:00.000Z'),
      });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      await repo.restore('restore-me');

      const written = (backend.writePrompts as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const restored = written.find((p: PromptRecipe) => p.id === 'restore-me');

      expect(restored.archived).toBe(false);
      expect(restored.archivedAt).toBeNull();
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.restore('nonexistent')).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });
  });

  describe('duplicate', () => {
    it('should create a copy with "Copy of" prefix and new id', async () => {
      const original = makePromptRecipe({
        id: 'dup-me',
        title: 'Original Title',
        body: 'Some body text',
        tags: ['tag1'],
      });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const result = await repo.duplicate('dup-me');

      expect(result.id).not.toBe('dup-me');
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.title).toBe('Copy of Original Title');
      expect(result.body).toBe('Some body text');
      expect(result.tags).toEqual(['tag1']);
      expect(result.version).toBe(1);
      expect(result.favorite).toBe(false);
      expect(result.archived).toBe(false);
      expect(result.archivedAt).toBeNull();
      expect(result.lastUsedAt).toBeNull();
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.duplicate('nonexistent')).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should flip favorite from false to true', async () => {
      const original = makePromptRecipe({ id: 'fav-me', favorite: false });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const result = await repo.toggleFavorite('fav-me');
      expect(result.favorite).toBe(true);
    });

    it('should flip favorite from true to false', async () => {
      const original = makePromptRecipe({ id: 'unfav-me', favorite: true });
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([original]);

      const result = await repo.toggleFavorite('unfav-me');
      expect(result.favorite).toBe(false);
    });

    it('should throw when prompt not found', async () => {
      (backend.readPrompts as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      await expect(repo.toggleFavorite('nonexistent')).rejects.toThrow(
        'Prompt not found: nonexistent',
      );
    });
  });
});


// ─── Generators ────────────────────────────────────────────────────────────────

/** Generates a non-empty alphanumeric string suitable for titles, descriptions, etc. */
const nonEmptyStringArb = fc.stringMatching(/^[a-zA-Z0-9 _]{1,50}$/);

/** Generates a valid tag string */
const tagArb = fc.stringMatching(/^[a-z]{1,15}$/);

/** Generates a valid PromptRecipe input (without id, createdAt, updatedAt) for repo.create() */
const promptInputArb = fc.record({
  workspaceId: fc.constant('local'),
  title: nonEmptyStringArb,
  description: nonEmptyStringArb,
  body: nonEmptyStringArb,
  tags: fc.array(tagArb, { minLength: 0, maxLength: 5 }),
  folderId: fc.constant(null),
  favorite: fc.boolean(),
  archived: fc.constant(false),
  archivedAt: fc.constant(null),
  lastUsedAt: fc.constant(null),
  createdBy: fc.constant('local'),
  version: fc.constant(1),
});

/** Creates a fresh mock backend and repository for each property test iteration */
function createFreshRepoAndBackend(): { backend: LocalStorageBackend; repo: PromptRepository } {
  let stored: PromptRecipe[] = [];
  const backend = {
    readPrompts: vi.fn(async () => stored.map((p) => ({ ...p }))),
    writePrompts: vi.fn(async (prompts: PromptRecipe[]) => {
      stored = prompts.map((p) => ({ ...p }));
    }),
  } as unknown as LocalStorageBackend;
  const repo = new PromptRepository(backend);
  return { backend, repo };
}

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 3: Archive/Restore Round-Trip', () => {
  /**
   * **Validates: Requirements 7.6, 11.6, 11.7**
   *
   * For any non-archived PromptRecipe, archiving it SHALL set archived to true and
   * archivedAt to a non-null timestamp, and subsequently restoring it SHALL set
   * archived to false and archivedAt to null.
   */
  it('should archive (archived=true, archivedAt non-null) then restore (archived=false, archivedAt=null)', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptInputArb,
        async (input) => {
          const { repo } = createFreshRepoAndBackend();

          // Create a non-archived prompt
          const created = await repo.create(input);
          expect(created.archived).toBe(false);
          expect(created.archivedAt).toBeNull();

          // Archive it
          await repo.softDelete(created.id);
          const afterArchive = await repo.getById(created.id);
          expect(afterArchive).not.toBeNull();
          expect(afterArchive!.archived).toBe(true);
          expect(afterArchive!.archivedAt).not.toBeNull();
          expect(afterArchive!.archivedAt).toBeInstanceOf(Date);

          // Restore it
          await repo.restore(created.id);
          const afterRestore = await repo.getById(created.id);
          expect(afterRestore).not.toBeNull();
          expect(afterRestore!.archived).toBe(false);
          expect(afterRestore!.archivedAt).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 14: Update Sets updatedAt Timestamp', () => {
  /**
   * **Validates: Requirements 11.3**
   *
   * For any existing PromptRecipe and any valid partial update, the updated recipe's
   * updatedAt is strictly greater than the original.
   */
  it('should set updatedAt strictly greater than the original after any update', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptInputArb,
        nonEmptyStringArb,
        async (input, newTitle) => {
          const { repo } = createFreshRepoAndBackend();

          // Create a prompt — its updatedAt is set to "now"
          const created = await repo.create(input);
          const originalUpdatedAt = created.updatedAt.getTime();

          // Small delay to ensure Date.now() advances (sub-ms resolution can be equal)
          await new Promise((resolve) => setTimeout(resolve, 2));

          // Update with a new title
          const updated = await repo.update(created.id, { title: newTitle });

          expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 15: Duplicate Prefixes Title', () => {
  /**
   * **Validates: Requirements 11.4**
   *
   * For any PromptRecipe, duplicating it via the Prompt_Repository SHALL produce a new
   * recipe with a title equal to "Copy of " + originalTitle and a different id.
   */
  it('should produce a duplicate with "Copy of " prefix and a different id', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptInputArb,
        async (input) => {
          const { repo } = createFreshRepoAndBackend();

          const created = await repo.create(input);
          const duplicated = await repo.duplicate(created.id);

          expect(duplicated.id).not.toBe(created.id);
          expect(duplicated.title).toBe(`Copy of ${created.title}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 16: Favorite Toggle Flips Boolean', () => {
  /**
   * **Validates: Requirements 11.5**
   *
   * For any PromptRecipe, toggling favorite produces a recipe whose favorite is the
   * logical negation of the original.
   */
  it('should flip the favorite boolean on toggle', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptInputArb,
        async (input) => {
          const { repo } = createFreshRepoAndBackend();

          const created = await repo.create(input);
          const originalFavorite = created.favorite;

          const toggled = await repo.toggleFavorite(created.id);
          expect(toggled.favorite).toBe(!originalFavorite);

          // Toggle again to verify it flips back
          const toggledBack = await repo.toggleFavorite(created.id);
          expect(toggledBack.favorite).toBe(originalFavorite);
        }
      ),
      { numRuns: 100 }
    );
  });
});
