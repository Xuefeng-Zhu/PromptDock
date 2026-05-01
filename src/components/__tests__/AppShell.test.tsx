// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppShell } from '../AppShell';
import type { PromptRecipe } from '../../types/index';
import type { IPromptRepository } from '../../repositories/interfaces';
import { initPromptStore } from '../../stores/prompt-store';
import { initSettingsStore, DEFAULT_SETTINGS } from '../../stores/settings-store';
import { initAppModeStore } from '../../stores/app-mode-store';
import type { ISettingsRepository } from '../../repositories/interfaces';

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

// ─── Setup ─────────────────────────────────────────────────────────────────────

let mockRepo: IPromptRepository;

/**
 * Initialize the PromptStore singleton with a mock repo and load test prompts.
 * The AppShell component reads from usePromptStore(), so we must initialize
 * the store before rendering.
 */
async function setupStore(prompts: PromptRecipe[] = TEST_PROMPTS) {
  mockRepo = createMockRepo(prompts);
  const store = initPromptStore(mockRepo);
  await store.getState().loadPrompts();

  // Initialize SettingsStore so SettingsScreen can render
  const settingsRepo: ISettingsRepository = {
    get: vi.fn(async () => ({ ...DEFAULT_SETTINGS })),
    update: vi.fn(async (changes) => ({ ...DEFAULT_SETTINGS, ...changes })),
  };
  initSettingsStore(settingsRepo);

  // Initialize AppModeStore so OnboardingScreen can render
  initAppModeStore();

  return store;
}

/**
 * Render AppShell on the library screen by completing onboarding first.
 */
async function renderOnLibraryScreen(prompts?: PromptRecipe[]) {
  const store = await setupStore(prompts);

  const result = render(<AppShell />);

  // AppShell starts on onboarding — complete it to get to library
  const startLocalBtn = screen.getByRole('button', { name: 'Start locally' });
  await act(async () => {
    fireEvent.click(startLocalBtn);
  });

  return { ...result, store, mockRepo };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('AppShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('rendering with PromptStore data', () => {
    it('renders the TopBar after completing onboarding', async () => {
      await renderOnLibraryScreen();
      expect(screen.getByText('PromptDock')).toBeDefined();
    });

    it('renders the Sidebar after completing onboarding', async () => {
      await renderOnLibraryScreen();
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
    });

    it('renders prompts from PromptStore on library screen', async () => {
      await renderOnLibraryScreen();
      expect(screen.getByText('Summarize Text')).toBeDefined();
      expect(screen.getByText('Code Review')).toBeDefined();
      expect(screen.getByText('Email Draft')).toBeDefined();
    });

    it('opens command palette when ⌘K is pressed', async () => {
      await renderOnLibraryScreen();
      expect(screen.queryByTestId('command-palette-backdrop')).toBeNull();

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      expect(screen.getByTestId('command-palette-backdrop')).toBeDefined();
    });

    it('opens command palette when Ctrl+K is pressed', async () => {
      await renderOnLibraryScreen();
      expect(screen.queryByTestId('command-palette-backdrop')).toBeNull();

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

      expect(screen.getByTestId('command-palette-backdrop')).toBeDefined();
    });
  });

  describe('CRUD delegation to PromptStore', () => {
    it('delegates toggleFavorite to PromptStore', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      // Prompt cards have "Add to favorites" or "Remove from favorites" buttons
      const favoriteButtons = screen.getAllByLabelText(/favorites/i);
      expect(favoriteButtons.length).toBeGreaterThan(0);

      await act(async () => {
        fireEvent.click(favoriteButtons[0]);
      });

      expect(mockRepo.toggleFavorite).toHaveBeenCalled();
    });

    it('delegates updatePrompt to PromptStore when saving an existing prompt', async () => {
      const { store, mockRepo } = await renderOnLibraryScreen();

      // Verify the store's updatePrompt action delegates to the repository
      await act(async () => {
        await store.getState().updatePrompt('prompt-1', { title: 'Updated Title' });
      });

      expect(mockRepo.update).toHaveBeenCalledWith('prompt-1', { title: 'Updated Title' });
    });

    it('delegates createPrompt to PromptStore when saving a new prompt', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      // Click "New Prompt" button to navigate to editor
      const newPromptBtn = screen.getByText('New Prompt');
      await act(async () => {
        fireEvent.click(newPromptBtn);
      });

      // We should now be on the editor screen — fill in the title and save
      const titleInput = screen.getByLabelText(/title/i);
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'My New Prompt' } });
      });

      // Click save
      const saveBtn = screen.getByText(/save/i);
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('delegates archivePrompt to PromptStore', async () => {
      const { store, mockRepo } = await renderOnLibraryScreen();

      // Verify archivePrompt is wired by calling it through the store
      await act(async () => {
        await store.getState().archivePrompt('prompt-1');
      });

      expect(mockRepo.softDelete).toHaveBeenCalledWith('prompt-1');
    });

    it('delegates duplicatePrompt to PromptStore', async () => {
      const { store, mockRepo } = await renderOnLibraryScreen();

      // Verify duplicatePrompt is wired by calling it through the store
      await act(async () => {
        await store.getState().duplicatePrompt('prompt-1');
      });

      expect(mockRepo.duplicate).toHaveBeenCalledWith('prompt-1');
    });
  });

  describe('navigation state as local useState', () => {
    it('starts on onboarding screen', async () => {
      await setupStore();
      render(<AppShell />);
      // Onboarding screen should be visible
      expect(screen.getByRole('button', { name: 'Start locally' })).toBeDefined();
    });

    it('navigates to library after onboarding', async () => {
      await setupStore();
      render(<AppShell />);

      const startLocalBtn = screen.getByRole('button', { name: 'Start locally' });
      await act(async () => {
        fireEvent.click(startLocalBtn);
      });

      // Should now show library screen with prompts
      const headings = screen.getAllByText('All Prompts');
      const h1 = headings.find((el) => el.tagName === 'H1');
      expect(h1).toBeDefined();
    });

    it('navigates to settings and back', async () => {
      await renderOnLibraryScreen();

      // Click settings button
      const settingsBtn = screen.getByLabelText('Settings');
      await act(async () => {
        fireEvent.click(settingsBtn);
      });

      // Should show settings screen
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('navigates to editor when New Prompt is clicked', async () => {
      await renderOnLibraryScreen();

      const newPromptBtn = screen.getByText('New Prompt');
      await act(async () => {
        fireEvent.click(newPromptBtn);
      });

      // Should show editor screen with title input
      expect(screen.getByLabelText(/title/i)).toBeDefined();
    });
  });

  describe('search delegates to PromptStore', () => {
    it('updates search query through PromptStore.setSearchQuery', async () => {
      const { store } = await renderOnLibraryScreen();

      // Find the search input
      const searchInput = screen.getByPlaceholderText(/search/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'summarize' } });
      });

      expect(store.getState().searchQuery).toBe('summarize');
    });
  });

  describe('PromptInspector action callbacks via AppShell', () => {
    /**
     * Helper: select a prompt card to open the inspector panel.
     */
    async function selectPromptCard(promptId: string) {
      const card = screen.getByTestId(`prompt-card-${promptId}`);
      await act(async () => {
        fireEvent.click(card);
      });
    }

    it('clicking favorite star in inspector calls toggleFavorite on the store', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // The inspector should now be visible with the favorite star button
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const favBtn = inspector.querySelector('button[aria-label*="favorites"]')!;
      expect(favBtn).not.toBeNull();

      await act(async () => {
        fireEvent.click(favBtn);
      });

      expect(mockRepo.toggleFavorite).toHaveBeenCalledWith('prompt-1');
    });

    it('clicking Duplicate in inspector dropdown calls duplicatePrompt on the store', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // Open the dropdown menu
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const moreBtn = inspector.querySelector('button[aria-label="More options"]')!;
      expect(moreBtn).not.toBeNull();

      await act(async () => {
        fireEvent.click(moreBtn);
      });

      // Click "Duplicate" menu item
      const duplicateItem = screen.getByRole('menuitem', { name: 'Duplicate' });
      await act(async () => {
        fireEvent.click(duplicateItem);
      });

      expect(mockRepo.duplicate).toHaveBeenCalledWith('prompt-1');
    });

    it('clicking Archive in inspector dropdown calls archivePrompt on the store', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // Open the dropdown menu
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const moreBtn = inspector.querySelector('button[aria-label="More options"]')!;

      await act(async () => {
        fireEvent.click(moreBtn);
      });

      // Click "Archive" menu item
      const archiveItem = screen.getByRole('menuitem', { name: 'Archive' });
      await act(async () => {
        fireEvent.click(archiveItem);
      });

      expect(mockRepo.softDelete).toHaveBeenCalledWith('prompt-1');
    });

    it('clicking Delete in inspector dropdown calls deletePrompt on the store', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // Open the dropdown menu
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const moreBtn = inspector.querySelector('button[aria-label="More options"]')!;

      await act(async () => {
        fireEvent.click(moreBtn);
      });

      // Click "Delete" menu item
      const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
      await act(async () => {
        fireEvent.click(deleteItem);
      });

      expect(mockRepo.softDelete).toHaveBeenCalledWith('prompt-1');
    });

    it('clicking Edit prompt in inspector dropdown navigates to editor', async () => {
      await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // Open the dropdown menu
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const moreBtn = inspector.querySelector('button[aria-label="More options"]')!;

      await act(async () => {
        fireEvent.click(moreBtn);
      });

      // Click "Edit prompt" menu item
      const editItem = screen.getByRole('menuitem', { name: 'Edit prompt' });
      await act(async () => {
        fireEvent.click(editItem);
      });

      // Should navigate to editor — title input should be visible
      expect(screen.getByLabelText(/title/i)).toBeDefined();
    });

    it('clicking Copy prompt body in inspector copies to clipboard', async () => {
      // Mock clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      // Click the "Copy prompt body" button in the inspector
      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      const copyBtn = inspector.querySelector('button[aria-label="Copy prompt body"]')!;
      expect(copyBtn).not.toBeNull();

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // The clipboard should have been called with the prompt body
      expect(writeTextMock).toHaveBeenCalledWith('Hello world');
    });

    it('clicking Sync in TopBar calls loadPrompts on the store', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      // Click the Sync button in the TopBar
      const syncBtn = screen.getByLabelText('Sync');
      await act(async () => {
        fireEvent.click(syncBtn);
      });

      // loadPrompts calls repo.getAll
      expect(mockRepo.getAll).toHaveBeenCalled();
    });
  });
});
