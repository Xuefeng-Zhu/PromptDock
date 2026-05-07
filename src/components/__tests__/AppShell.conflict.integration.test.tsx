// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppShell } from '../app-shell';
import type { Folder, PromptRecipe } from '../../types/index';
import type { IFolderRepository, IPromptRepository, ISettingsRepository } from '../../repositories/interfaces';
import { initFolderStore } from '../../stores/folder-store';
import { initPromptStore } from '../../stores/prompt-store';
import { initSettingsStore, DEFAULT_SETTINGS } from '../../stores/settings-store';
import { initAppModeStore } from '../../stores/app-mode-store';
import { ConflictService } from '../../services/conflict-service';

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello world',
    tags: ['test'],
    folderId: 'folder-writing',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: new Date('2024-12-20'),
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

const TEST_PROMPTS: PromptRecipe[] = [
  makePrompt({ id: 'prompt-1', title: 'Summarize Text', folderId: 'folder-writing', favorite: true }),
  makePrompt({ id: 'prompt-2', title: 'Code Review', folderId: 'folder-engineering', favorite: false }),
  makePrompt({ id: 'prompt-3', title: 'Email Draft', folderId: 'folder-work', favorite: false }),
];

function createMockRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
  const prompts = [...initialPrompts];

  return {
    getAll: vi.fn(async () => prompts.map((p) => ({ ...p }))),
    getById: vi.fn(async (id) => prompts.find((p) => p.id === id) ?? null),
    create: vi.fn(async (data) => {
      const created: PromptRecipe = {
        ...data,
        id: `prompt-${Date.now()}`,
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
    delete: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => {
      const original = prompts.find((p) => p.id === id);
      if (!original) throw new Error(`Prompt not found: ${id}`);
      const dup: PromptRecipe = {
        ...original,
        id: `prompt-dup-${Date.now()}`,
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
  };
}

function createMockFolderRepo(initialFolders: Folder[] = []): IFolderRepository {
  return {
    getAllFolders: vi.fn(async () => initialFolders.map((folder) => ({ ...folder }))),
    reloadAllFolders: vi.fn(async () => initialFolders.map((folder) => ({ ...folder }))),
    createFolder: vi.fn(async (name) => ({
      id: `folder-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

let mockRepo: IPromptRepository;

async function setupStore(prompts: PromptRecipe[] = TEST_PROMPTS) {
  mockRepo = createMockRepo(prompts);
  const store = initPromptStore(mockRepo);
  await store.getState().loadPrompts();

  const folderStore = initFolderStore(createMockFolderRepo());
  await folderStore.getState().loadFolders();

  const settingsRepo: ISettingsRepository = {
    get: vi.fn(async () => ({ ...DEFAULT_SETTINGS })),
    update: vi.fn(async (changes) => ({ ...DEFAULT_SETTINGS, ...changes })),
  };
  initSettingsStore(settingsRepo);
  initAppModeStore();

  return store;
}

async function renderOnLibraryScreen(
  prompts?: PromptRecipe[],
  conflictService?: ConflictService,
) {
  const store = await setupStore(prompts);

  const result = render(
    <AppShell conflictService={conflictService} />,
  );

  // Complete onboarding to get to library
  const startLocalBtn = screen.getByRole('button', { name: 'Start locally' });
  await act(async () => {
    fireEvent.click(startLocalBtn);
  });

  return { ...result, store, mockRepo };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('AppShell — Conflict Resolution UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('ConflictBadge display', () => {
    it('does not show conflict badge when there are no conflicts', async () => {
      const conflictService = new ConflictService();
      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // No badge should be visible
      expect(screen.queryByLabelText(/unresolved conflict/i)).toBeNull();
    });

    it('shows conflict badge with count when unresolved conflicts exist', async () => {
      const conflictService = new ConflictService();

      // Create a conflict
      const localVersion = makePrompt({
        id: 'prompt-1',
        title: 'Local Title',
        body: 'Local body',
        version: 2,
        updatedAt: new Date('2024-06-01'),
      });
      const remoteVersion = makePrompt({
        id: 'prompt-1',
        title: 'Remote Title',
        body: 'Remote body',
        version: 3,
        updatedAt: new Date('2024-06-02'),
      });
      conflictService.processConflict(localVersion, remoteVersion);

      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Badge should be visible with count
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      expect(badge).toBeDefined();
      expect(badge.textContent).toContain('1');
    });

    it('shows correct count for multiple conflicts', async () => {
      const conflictService = new ConflictService();

      // Create two conflicts for different prompts
      conflictService.processConflict(
        makePrompt({ id: 'prompt-1', title: 'Local 1', body: 'body1', version: 2, updatedAt: new Date('2024-06-01') }),
        makePrompt({ id: 'prompt-1', title: 'Remote 1', body: 'body1r', version: 3, updatedAt: new Date('2024-06-02') }),
      );
      conflictService.processConflict(
        makePrompt({ id: 'prompt-2', title: 'Local 2', body: 'body2', version: 2, updatedAt: new Date('2024-06-01') }),
        makePrompt({ id: 'prompt-2', title: 'Remote 2', body: 'body2r', version: 3, updatedAt: new Date('2024-06-02') }),
      );

      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      const badge = screen.getByLabelText(/2 unresolved conflicts/i);
      expect(badge).toBeDefined();
      expect(badge.textContent).toContain('2');
    });
  });

  describe('ConflictCenter navigation', () => {
    it('navigates to ConflictCenter when conflict badge is clicked', async () => {
      const conflictService = new ConflictService();
      conflictService.processConflict(
        makePrompt({ id: 'prompt-1', title: 'Local Title', body: 'Local body', version: 2, updatedAt: new Date('2024-06-01') }),
        makePrompt({ id: 'prompt-1', title: 'Remote Title', body: 'Remote body', version: 3, updatedAt: new Date('2024-06-02') }),
      );

      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Click the conflict badge
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      await act(async () => {
        fireEvent.click(badge);
      });

      // ConflictCenter should be visible
      expect(screen.getByText('Conflict Center')).toBeDefined();
    });

    it('navigates back to library from ConflictCenter', async () => {
      const conflictService = new ConflictService();
      conflictService.processConflict(
        makePrompt({ id: 'prompt-1', title: 'Local Title', body: 'Local body', version: 2, updatedAt: new Date('2024-06-01') }),
        makePrompt({ id: 'prompt-1', title: 'Remote Title', body: 'Remote body', version: 3, updatedAt: new Date('2024-06-02') }),
      );

      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Navigate to ConflictCenter
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      await act(async () => {
        fireEvent.click(badge);
      });

      expect(screen.getByText('Conflict Center')).toBeDefined();

      // Click back button
      const backBtn = screen.getByLabelText('Back to library');
      await act(async () => {
        fireEvent.click(backBtn);
      });

      // Should be back on library screen
      const headings = screen.getAllByText('All Prompts');
      const h1 = headings.find((el) => el.tagName === 'H1');
      expect(h1).toBeDefined();
    });
  });

  describe('Conflict resolution', () => {
    it('"Keep Local" resolves conflict and updates PromptStore', async () => {
      const conflictService = new ConflictService();
      const localVersion = makePrompt({
        id: 'prompt-1',
        title: 'Local Title',
        body: 'Local body content',
        version: 2,
        updatedAt: new Date('2024-06-01'),
      });
      const remoteVersion = makePrompt({
        id: 'prompt-1',
        title: 'Remote Title',
        body: 'Remote body content',
        version: 3,
        updatedAt: new Date('2024-06-02'),
      });
      conflictService.processConflict(localVersion, remoteVersion);

      const { mockRepo } = await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Navigate to ConflictCenter
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      await act(async () => {
        fireEvent.click(badge);
      });

      // Click "Keep Local"
      const keepLocalBtn = screen.getByText('Keep Local');
      await act(async () => {
        fireEvent.click(keepLocalBtn);
      });

      // Conflict should be resolved — ConflictService should have 0 unresolved
      expect(conflictService.getUnresolvedCount()).toBe(0);

      // PromptStore.updatePrompt should have been called with the local version
      expect(mockRepo.update).toHaveBeenCalledWith(
        'prompt-1',
        expect.objectContaining({ title: 'Local Title', body: 'Local body content' }),
      );
    });

    it('"Keep Remote" resolves conflict and updates PromptStore', async () => {
      const conflictService = new ConflictService();
      const localVersion = makePrompt({
        id: 'prompt-1',
        title: 'Local Title',
        body: 'Local body content',
        version: 2,
        updatedAt: new Date('2024-06-01'),
      });
      const remoteVersion = makePrompt({
        id: 'prompt-1',
        title: 'Remote Title',
        body: 'Remote body content',
        version: 3,
        updatedAt: new Date('2024-06-02'),
      });
      conflictService.processConflict(localVersion, remoteVersion);

      const { mockRepo } = await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Navigate to ConflictCenter
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      await act(async () => {
        fireEvent.click(badge);
      });

      // Click "Keep Remote"
      const keepRemoteBtn = screen.getByText('Keep Remote');
      await act(async () => {
        fireEvent.click(keepRemoteBtn);
      });

      // Conflict should be resolved
      expect(conflictService.getUnresolvedCount()).toBe(0);

      // PromptStore.updatePrompt should have been called with the remote version
      expect(mockRepo.update).toHaveBeenCalledWith(
        'prompt-1',
        expect.objectContaining({ title: 'Remote Title', body: 'Remote body content' }),
      );
    });

    it('badge disappears after all conflicts are resolved', async () => {
      const conflictService = new ConflictService();
      conflictService.processConflict(
        makePrompt({ id: 'prompt-1', title: 'Local', body: 'local body', version: 2, updatedAt: new Date('2024-06-01') }),
        makePrompt({ id: 'prompt-1', title: 'Remote', body: 'remote body', version: 3, updatedAt: new Date('2024-06-02') }),
      );

      await renderOnLibraryScreen(TEST_PROMPTS, conflictService);

      // Badge should be visible
      expect(screen.getByLabelText(/1 unresolved conflict/i)).toBeDefined();

      // Navigate to ConflictCenter and resolve
      const badge = screen.getByLabelText(/1 unresolved conflict/i);
      await act(async () => {
        fireEvent.click(badge);
      });

      const keepLocalBtn = screen.getByText('Keep Local');
      await act(async () => {
        fireEvent.click(keepLocalBtn);
      });

      // Navigate back to library
      const backBtn = screen.getByLabelText('Back to library');
      await act(async () => {
        fireEvent.click(backBtn);
      });

      // Badge should no longer be visible
      expect(screen.queryByLabelText(/unresolved conflict/i)).toBeNull();
    });
  });
});
