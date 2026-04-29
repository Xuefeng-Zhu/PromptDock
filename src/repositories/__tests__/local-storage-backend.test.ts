import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { PromptRecipe, Folder, UserSettings, Workspace } from '../../types/index';

// ─── Mock @tauri-apps/plugin-store ─────────────────────────────────────────────

// In-memory store that simulates the Tauri Store plugin behavior
function createMockStore() {
  const data = new Map<string, unknown>();
  return {
    get: vi.fn(async <T>(key: string): Promise<T | undefined> => data.get(key) as T | undefined),
    set: vi.fn(async (key: string, value: unknown) => { data.set(key, value); }),
    has: vi.fn(async (key: string) => data.has(key)),
    delete: vi.fn(async (key: string) => data.delete(key)),
    clear: vi.fn(async () => { data.clear(); }),
    save: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
    entries: vi.fn(async () => Array.from(data.entries())),
    keys: vi.fn(async () => Array.from(data.keys())),
    values: vi.fn(async () => Array.from(data.values())),
    length: vi.fn(async () => data.size),
    _data: data, // exposed for test inspection
  };
}

const mockStores = new Map<string, ReturnType<typeof createMockStore>>();

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(async (fileName: string) => {
    if (!mockStores.has(fileName)) {
      mockStores.set(fileName, createMockStore());
    }
    return mockStores.get(fileName)!;
  }),
}));

// Import after mock setup
import {
  LocalStorageBackend,
  serializePrompt,
  deserializePrompt,
  DEFAULT_SETTINGS,
} from '../local-storage-backend';

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

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-1',
    name: 'Test Folder',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'local',
    name: 'My Prompts',
    ownerId: 'local',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    mockStores.clear();
    backend = new LocalStorageBackend();
  });

  describe('initialize', () => {
    it('should load all stores on initialization', async () => {
      await backend.initialize();

      // All four store files should be loaded
      expect(mockStores.size).toBe(4);
      expect(mockStores.has('prompts.json')).toBe(true);
      expect(mockStores.has('folders.json')).toBe(true);
      expect(mockStores.has('settings.json')).toBe(true);
      expect(mockStores.has('workspace.json')).toBe(true);
    });

    it('should initialize default settings when empty', async () => {
      await backend.initialize();

      const settings = await backend.readSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should initialize default workspace when empty', async () => {
      await backend.initialize();

      const workspace = await backend.readWorkspace();
      expect(workspace.id).toBe('local');
      expect(workspace.name).toBe('My Prompts');
      expect(workspace.ownerId).toBe('local');
    });

    it('should be idempotent (calling initialize twice is safe)', async () => {
      await backend.initialize();
      await backend.initialize();

      expect(mockStores.size).toBe(4);
    });
  });

  describe('prompts read/write', () => {
    beforeEach(async () => {
      await backend.initialize();
    });

    it('should return empty array when no prompts exist', async () => {
      const prompts = await backend.readPrompts();
      expect(prompts).toEqual([]);
    });

    it('should write and read prompts with round-trip equality', async () => {
      const prompt = makePromptRecipe();
      await backend.writePrompts([prompt]);

      const result = await backend.readPrompts();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(prompt);
    });

    it('should handle multiple prompts', async () => {
      const prompts = [
        makePromptRecipe({ id: 'p1', title: 'First' }),
        makePromptRecipe({ id: 'p2', title: 'Second' }),
        makePromptRecipe({ id: 'p3', title: 'Third' }),
      ];
      await backend.writePrompts(prompts);

      const result = await backend.readPrompts();
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.title)).toEqual(['First', 'Second', 'Third']);
    });

    it('should preserve Date objects through serialization', async () => {
      const prompt = makePromptRecipe({
        createdAt: new Date('2024-06-15T10:30:00.000Z'),
        updatedAt: new Date('2024-06-16T14:00:00.000Z'),
        archivedAt: new Date('2024-06-17T08:00:00.000Z'),
        lastUsedAt: new Date('2024-06-18T12:00:00.000Z'),
      });
      await backend.writePrompts([prompt]);

      const result = await backend.readPrompts();
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(result[0].archivedAt).toBeInstanceOf(Date);
      expect(result[0].lastUsedAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2024-06-15T10:30:00.000Z');
    });

    it('should handle null date fields', async () => {
      const prompt = makePromptRecipe({
        archivedAt: null,
        lastUsedAt: null,
      });
      await backend.writePrompts([prompt]);

      const result = await backend.readPrompts();
      expect(result[0].archivedAt).toBeNull();
      expect(result[0].lastUsedAt).toBeNull();
    });

    it('should persist to disk on every write (save called)', async () => {
      const prompt = makePromptRecipe();
      await backend.writePrompts([prompt]);

      const store = mockStores.get('prompts.json')!;
      expect(store.save).toHaveBeenCalled();
    });
  });

  describe('folders read/write', () => {
    beforeEach(async () => {
      await backend.initialize();
    });

    it('should return empty array when no folders exist', async () => {
      const folders = await backend.readFolders();
      expect(folders).toEqual([]);
    });

    it('should write and read folders with round-trip equality', async () => {
      const folder = makeFolder();
      await backend.writeFolders([folder]);

      const result = await backend.readFolders();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(folder);
    });

    it('should persist folders to disk on write', async () => {
      await backend.writeFolders([makeFolder()]);

      const store = mockStores.get('folders.json')!;
      expect(store.save).toHaveBeenCalled();
    });
  });

  describe('settings read/write', () => {
    beforeEach(async () => {
      await backend.initialize();
    });

    it('should return default settings when none are stored', async () => {
      // Clear the settings that were written during initialize
      const store = mockStores.get('settings.json')!;
      store._data.clear();

      const settings = await backend.readSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should write and read settings', async () => {
      const customSettings: UserSettings = {
        hotkeyCombo: 'CommandOrControl+Shift+L',
        theme: 'dark',
        defaultAction: 'paste',
        activeWorkspaceId: 'workspace-123',
      };
      await backend.writeSettings(customSettings);

      const result = await backend.readSettings();
      expect(result).toEqual(customSettings);
    });

    it('should persist settings to disk on write', async () => {
      await backend.writeSettings(DEFAULT_SETTINGS);

      const store = mockStores.get('settings.json')!;
      expect(store.save).toHaveBeenCalled();
    });
  });

  describe('workspace read/write', () => {
    beforeEach(async () => {
      await backend.initialize();
    });

    it('should return default workspace when none is stored', async () => {
      // Clear the workspace that was written during initialize
      const store = mockStores.get('workspace.json')!;
      store._data.clear();

      const workspace = await backend.readWorkspace();
      expect(workspace.id).toBe('local');
      expect(workspace.name).toBe('My Prompts');
    });

    it('should write and read workspace with round-trip equality', async () => {
      const workspace = makeWorkspace({ name: 'Custom Workspace' });
      await backend.writeWorkspace(workspace);

      const result = await backend.readWorkspace();
      expect(result).toEqual(workspace);
    });

    it('should persist workspace to disk on write', async () => {
      await backend.writeWorkspace(makeWorkspace());

      const store = mockStores.get('workspace.json')!;
      expect(store.save).toHaveBeenCalled();
    });
  });

  describe('corrupted data handling', () => {
    beforeEach(async () => {
      await backend.initialize();
    });

    it('should return empty array when prompts data is not an array', async () => {
      const store = mockStores.get('prompts.json')!;
      store._data.set('data', 'not-an-array');

      const result = await backend.readPrompts();
      expect(result).toEqual([]);
    });

    it('should return empty array when folders data is not an array', async () => {
      const store = mockStores.get('folders.json')!;
      store._data.set('data', { invalid: true });

      const result = await backend.readFolders();
      expect(result).toEqual([]);
    });

    it('should return default workspace when workspace data is missing', async () => {
      const store = mockStores.get('workspace.json')!;
      store._data.clear();

      const workspace = await backend.readWorkspace();
      expect(workspace.id).toBe('local');
      expect(workspace.name).toBe('My Prompts');
    });

    it('should return default settings when settings data is missing', async () => {
      const store = mockStores.get('settings.json')!;
      store._data.clear();

      const settings = await backend.readSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('serialization helpers', () => {
    it('should serialize and deserialize a PromptRecipe correctly', () => {
      const recipe = makePromptRecipe();
      const serialized = serializePrompt(recipe);
      const deserialized = deserializePrompt(serialized);

      expect(deserialized).toEqual(recipe);
    });

    it('should handle null dates in serialization', () => {
      const recipe = makePromptRecipe({ archivedAt: null, lastUsedAt: null });
      const serialized = serializePrompt(recipe);

      expect(serialized.archivedAt).toBeNull();
      expect(serialized.lastUsedAt).toBeNull();

      const deserialized = deserializePrompt(serialized);
      expect(deserialized.archivedAt).toBeNull();
      expect(deserialized.lastUsedAt).toBeNull();
    });

    it('should convert Date objects to ISO strings during serialization', () => {
      const recipe = makePromptRecipe({
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      const serialized = serializePrompt(recipe);

      expect(typeof serialized.createdAt).toBe('string');
      expect(serialized.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should convert ISO strings back to Date objects during deserialization', () => {
      const recipe = makePromptRecipe();
      const serialized = serializePrompt(recipe);
      const deserialized = deserializePrompt(serialized);

      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.updatedAt).toBeInstanceOf(Date);
    });
  });
});

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Arbitrary that generates valid Date objects within a reasonable range.
 * Constrains to dates between 2000-01-01 and 2099-12-31 to avoid edge cases
 * with extreme timestamps.
 */
const arbDate = fc
  .integer({ min: 946684800000, max: 4102444799999 }) // 2000-01-01 to 2099-12-31 in ms
  .map((ms) => new Date(ms));

/**
 * Arbitrary that generates valid PromptRecipe objects with all fields populated.
 */
const arbPromptRecipe: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
  title: fc.string({ minLength: 0, maxLength: 200 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  body: fc.string({ minLength: 0, maxLength: 1000 }),
  tags: fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  folderId: fc.option(fc.uuid(), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.boolean(),
  archivedAt: fc.option(arbDate, { nil: null }),
  createdAt: arbDate,
  updatedAt: arbDate,
  lastUsedAt: fc.option(arbDate, { nil: null }),
  createdBy: fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
  version: fc.nat({ max: 10000 }),
});

// ─── Property-Based Tests ──────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 1: Local Storage Round-Trip', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    mockStores.clear();
    backend = new LocalStorageBackend();
  });

  /**
   * **Validates: Requirements 6.5, 1.2**
   *
   * For any valid PromptRecipe object, writing it to LocalStorageBackend
   * and reading it back SHALL produce an object deeply equal to the original.
   */
  it('should round-trip any valid PromptRecipe through LocalStorageBackend', async () => {
    await fc.assert(
      fc.asyncProperty(arbPromptRecipe, async (recipe) => {
        // Reset stores for each iteration to ensure isolation
        mockStores.clear();
        backend = new LocalStorageBackend();
        await backend.initialize();

        // Write the recipe
        await backend.writePrompts([recipe]);

        // Read it back
        const result = await backend.readPrompts();

        // Assert deep equality
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(recipe);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 6.5, 1.2**
   *
   * For any array of valid PromptRecipe objects, writing them to
   * LocalStorageBackend and reading them back SHALL produce an array
   * deeply equal to the original.
   */
  it('should round-trip any array of valid PromptRecipes through LocalStorageBackend', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbPromptRecipe, { minLength: 0, maxLength: 20 }),
        async (recipes) => {
          // Reset stores for each iteration to ensure isolation
          mockStores.clear();
          backend = new LocalStorageBackend();
          await backend.initialize();

          // Write the recipes
          await backend.writePrompts(recipes);

          // Read them back
          const result = await backend.readPrompts();

          // Assert deep equality
          expect(result).toHaveLength(recipes.length);
          expect(result).toEqual(recipes);
        },
      ),
      { numRuns: 100 },
    );
  });
});
