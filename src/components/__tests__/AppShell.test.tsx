// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import type { PromptRecipe } from '../../types/index';
import type { IPromptRepository } from '../../repositories/interfaces';
import { initPromptStore } from '../../stores/prompt-store';
import { initSettingsStore, DEFAULT_SETTINGS } from '../../stores/settings-store';
import { initAppModeStore } from '../../stores/app-mode-store';
import type { ISettingsRepository } from '../../repositories/interfaces';

const { mockCopyToClipboard, mockPasteToActiveApp, mockHideMainWindow } = vi.hoisted(() => ({
  mockCopyToClipboard: vi.fn(() => Promise.resolve()),
  mockPasteToActiveApp: vi.fn(async (_text: string, beforePaste?: () => Promise<void>) => {
    await beforePaste?.();
    return { copied: true, pasted: true };
  }),
  mockHideMainWindow: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../utils/clipboard', () => ({
  copyToClipboard: mockCopyToClipboard,
  pasteToActiveApp: mockPasteToActiveApp,
}));

vi.mock('../../utils/window', () => ({
  hideMainWindow: mockHideMainWindow,
}));

import { AppShell, filterPrompts } from '../app-shell';

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
let mockSettingsRepo: ISettingsRepository;

/**
 * Initialize the PromptStore singleton with a mock repo and load test prompts.
 * The AppShell component reads from usePromptStore(), so we must initialize
 * the store before rendering.
 */
async function setupStore(
  prompts: PromptRecipe[] = TEST_PROMPTS,
  settings = { ...DEFAULT_SETTINGS },
) {
  mockRepo = createMockRepo(prompts);
  const store = initPromptStore(mockRepo);
  await store.getState().loadPrompts();

  // Initialize SettingsStore so SettingsScreen can render
  mockSettingsRepo = {
    get: vi.fn(async () => ({ ...settings })),
    update: vi.fn(async (changes) => ({ ...settings, ...changes })),
  };
  const settingsStore = initSettingsStore(mockSettingsRepo);
  await settingsStore.getState().loadSettings();

  // Initialize AppModeStore so OnboardingScreen can render
  initAppModeStore();

  return store;
}

/**
 * Render AppShell on the library screen by completing onboarding first.
 */
async function renderOnLibraryScreen(
  prompts?: PromptRecipe[],
  settings = { ...DEFAULT_SETTINGS },
) {
  const store = await setupStore(prompts, settings);

  const result = render(<AppShell />);

  // AppShell starts on onboarding — complete it to get to library
  const startLocalBtn = screen.getByRole('button', { name: 'Start locally' });
  await act(async () => {
    fireEvent.click(startLocalBtn);
  });

  return { ...result, store, mockRepo };
}

function mockTauriRuntime() {
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('AppShell', () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
    vi.restoreAllMocks();
    mockCopyToClipboard.mockReset();
    mockCopyToClipboard.mockResolvedValue(undefined);
    mockPasteToActiveApp.mockReset();
    mockPasteToActiveApp.mockImplementation(
      async (_text: string, beforePaste?: () => Promise<void>) => {
        await beforePaste?.();
        return { copied: true, pasted: true };
      },
    );
    mockHideMainWindow.mockReset();
    mockHideMainWindow.mockResolvedValue(undefined);
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

    it('pastes a prompt from the command palette when default action is paste', async () => {
      mockTauriRuntime();
      await renderOnLibraryScreen();

      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      const palette = screen.getByRole('dialog', { name: 'Command palette' });

      await act(async () => {
        fireEvent.click(within(palette).getByText('Summarize Text'));
      });

      await waitFor(() => {
        expect(mockPasteToActiveApp).toHaveBeenCalledWith('Hello world', mockHideMainWindow);
      });
      expect(mockCopyToClipboard).not.toHaveBeenCalled();
    });

    it('copies a prompt from the command palette when default action is copy', async () => {
      await renderOnLibraryScreen(undefined, { ...DEFAULT_SETTINGS, defaultAction: 'copy' });

      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      const palette = screen.getByRole('dialog', { name: 'Command palette' });

      await act(async () => {
        fireEvent.click(within(palette).getByText('Summarize Text'));
      });

      await waitFor(() => {
        expect(mockCopyToClipboard).toHaveBeenCalledWith('Hello world');
      });
      expect(mockPasteToActiveApp).not.toHaveBeenCalled();
    });

    it('uses copy as the browser variable-fill primary action when settings contain paste', async () => {
      await renderOnLibraryScreen([
        makePrompt({ id: 'prompt-variable', title: 'Greeting', body: 'Hello {{name}}' }),
      ]);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      const palette = screen.getByRole('dialog', { name: 'Command palette' });

      await act(async () => {
        fireEvent.click(within(palette).getByText('Greeting'));
      });

      const modal = screen.getByRole('dialog', { name: 'Fill variables for Greeting' });
      expect(within(modal).getByRole('button', { name: /Copy final prompt/i })).toBeDefined();
      expect(within(modal).queryByRole('button', { name: /Paste into active app/i })).toBeNull();
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

      // We should now be on the editor screen — fill in required fields and save
      const titleInput = screen.getByLabelText(/title/i);
      const bodyInput = screen.getByLabelText(/body/i);
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'My New Prompt' } });
        fireEvent.change(bodyInput, { target: { value: 'Prompt body' } });
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

    it('returns to the library when a sidebar item is clicked from settings', async () => {
      await renderOnLibraryScreen();

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Settings'));
      });

      expect(screen.getByText('Settings')).toBeDefined();

      await act(async () => {
        fireEvent.click(screen.getByText('Favorites'));
      });

      const headings = screen.getAllByText('All Prompts');
      const h1 = headings.find((el) => el.tagName === 'H1');
      expect(h1).toBeDefined();
      expect(screen.queryByText('Settings')).toBeNull();
    });

    it('keeps the editor open when sidebar navigation would discard unsaved changes', async () => {
      await renderOnLibraryScreen();

      await act(async () => {
        fireEvent.click(screen.getByText('New Prompt'));
      });

      const titleInput = screen.getByLabelText(/title/i);
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Unsaved draft' } });
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Favorites'));
      });

      expect(screen.getByDisplayValue('Unsaved draft')).toBeDefined();
      expect(screen.getByText('Save or cancel your prompt changes before leaving the editor.')).toBeDefined();
    });

    it('allows sidebar navigation from the editor when no prompt changes are pending', async () => {
      await renderOnLibraryScreen();

      await act(async () => {
        fireEvent.click(screen.getByText('New Prompt'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Favorites'));
      });

      const headings = screen.getAllByText('All Prompts');
      const h1 = headings.find((el) => el.tagName === 'H1');
      expect(h1).toBeDefined();
      expect(screen.queryByLabelText(/title/i)).toBeNull();
    });

    it('updates the theme when the sidebar theme toggle is clicked', async () => {
      await renderOnLibraryScreen();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
      });

      expect(mockSettingsRepo.update).toHaveBeenCalledWith({ theme: 'dark' });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeDefined();
      });
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

  describe('sidebar filtering', () => {
    it('filters sidebar favorites without treating favorites as a folder id', () => {
      const results = filterPrompts(TEST_PROMPTS, '', 'all', 'favorites');
      expect(results.map((prompt) => prompt.id)).toEqual(['prompt-1']);
    });

    it('filters sidebar archived prompts', () => {
      const archivedPrompt = makePrompt({
        id: 'prompt-archived',
        title: 'Archived Prompt',
        archived: true,
        archivedAt: new Date('2024-03-01'),
      });

      const results = filterPrompts([...TEST_PROMPTS, archivedPrompt], '', 'all', 'archived');
      expect(results.map((prompt) => prompt.id)).toEqual(['prompt-archived']);
    });

    it('filters sidebar tags by tag key', () => {
      const results = filterPrompts(TEST_PROMPTS, '', 'all', 'tag-test');
      expect(results).toHaveLength(3);
    });

    it('filters by multiple prompt attributes', () => {
      const prompts = [
        makePrompt({
          id: 'match',
          favorite: false,
          folderId: null,
          lastUsedAt: null,
          body: 'Hello {{name}}',
          tags: ['writing'],
        }),
        makePrompt({
          id: 'favorite',
          favorite: true,
          folderId: null,
          lastUsedAt: null,
          tags: ['draft'],
        }),
        makePrompt({
          id: 'foldered',
          favorite: false,
          folderId: 'folder-writing',
          lastUsedAt: null,
          body: 'Hello {{name}}',
          tags: ['writing'],
        }),
      ];

      const results = filterPrompts(
        prompts,
        '',
        {
          sortBy: 'lastUsed',
          query: '',
          statuses: ['hasVariables'],
          folders: ['writing'],
          tags: ['writing'],
          lastUsed: 'any',
        },
        'library',
      );

      expect(results.map((prompt) => prompt.id)).toEqual(['foldered']);
    });

    it('matches timestamped user folder ids from folder filters', () => {
      const prompts = [
        makePrompt({
          id: 'timestamped-folder',
          folderId: 'folder-client-work-1700000000000',
          tags: ['client'],
        }),
        makePrompt({
          id: 'other-folder',
          folderId: 'folder-client-workshop-1700000000000',
          tags: ['client'],
        }),
      ];

      const results = filterPrompts(
        prompts,
        '',
        {
          sortBy: 'lastUsed',
          query: '',
          statuses: [],
          folders: ['client-work'],
          tags: [],
          lastUsed: 'any',
        },
        'library',
      );

      expect(results.map((prompt) => prompt.id)).toEqual(['timestamped-folder']);
    });

    it('filters prompts by title or keyword query', () => {
      const prompts = [
        makePrompt({
          id: 'title-match',
          title: 'Client Email Draft',
          description: 'Write a note',
          body: 'Hello',
          tags: ['communication'],
        }),
        makePrompt({
          id: 'keyword-match',
          title: 'Follow-up',
          description: 'For renewal outreach',
          body: 'Prepare a customer retention plan',
          tags: ['sales'],
        }),
        makePrompt({
          id: 'miss',
          title: 'Code Review',
          description: 'Engineering feedback',
          body: 'Review implementation',
          tags: ['code'],
        }),
      ];

      const titleResults = filterPrompts(
        prompts,
        '',
        {
          sortBy: 'lastUsed',
          query: 'email',
          statuses: [],
          folders: [],
          tags: [],
          lastUsed: 'any',
        },
        'library',
      );
      expect(titleResults.map((prompt) => prompt.id)).toEqual(['title-match']);

      const keywordResults = filterPrompts(
        prompts,
        '',
        {
          sortBy: 'lastUsed',
          query: 'retention',
          statuses: [],
          folders: [],
          tags: [],
          lastUsed: 'any',
        },
        'library',
      );
      expect(keywordResults.map((prompt) => prompt.id)).toEqual(['keyword-match']);
    });
  });

  describe('selected prompt visibility', () => {
    it('clears the inspector when the selected prompt is no longer visible', async () => {
      await renderOnLibraryScreen();

      const selectedCard = screen.getByTestId('prompt-card-prompt-1');
      await act(async () => {
        fireEvent.click(selectedCard);
      });

      expect(screen.getByRole('complementary', { name: 'Prompt details' })).toBeDefined();

      const searchInput = screen.getByPlaceholderText(/search/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'code' } });
      });

      await waitFor(() => {
        expect(screen.queryByRole('complementary', { name: 'Prompt details' })).toBeNull();
      });
    });

    it('closes the inspector when the selected prompt card is clicked again', async () => {
      await renderOnLibraryScreen();

      const selectedCard = screen.getByTestId('prompt-card-prompt-1');
      await act(async () => {
        fireEvent.click(selectedCard);
      });

      expect(screen.getByRole('complementary', { name: 'Prompt details' })).toBeDefined();

      await act(async () => {
        fireEvent.click(selectedCard);
      });

      expect(screen.queryByRole('complementary', { name: 'Prompt details' })).toBeNull();
      expect(selectedCard.getAttribute('aria-selected')).toBe('false');
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

    it('adding a tag in the inspector updates the prompt tags', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      await act(async () => {
        fireEvent.click(within(inspector).getByRole('button', { name: 'Add tag' }));
      });

      const tagInput = within(inspector).getByLabelText('Add tag');
      await act(async () => {
        fireEvent.change(tagInput, { target: { value: 'urgent' } });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockRepo.update).toHaveBeenCalledWith('prompt-1', { tags: ['test', 'urgent'] });
      });
    });

    it('removing a tag in the inspector updates the prompt tags', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      await act(async () => {
        fireEvent.click(within(inspector).getByRole('button', { name: 'Remove test tag' }));
      });

      await waitFor(() => {
        expect(mockRepo.update).toHaveBeenCalledWith('prompt-1', { tags: [] });
      });
    });

    it('serializes rapid tag edits from the latest desired tags', async () => {
      const { mockRepo } = await renderOnLibraryScreen();
      let resolveFirstUpdate!: (prompt: PromptRecipe) => void;
      const firstUpdate = new Promise<PromptRecipe>((resolve) => {
        resolveFirstUpdate = resolve;
      });
      const updateCalls: Array<{ changes: Partial<PromptRecipe>; id: string }> = [];
      mockRepo.update = vi.fn((id: string, changes: Partial<PromptRecipe>) => {
        updateCalls.push({ id, changes });
        if (updateCalls.length === 1) return firstUpdate;
        return Promise.resolve(makePrompt({ id, ...changes }));
      });

      await selectPromptCard('prompt-1');

      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      await act(async () => {
        fireEvent.click(within(inspector).getByRole('button', { name: 'Add tag' }));
      });

      const tagInput = within(inspector).getByLabelText('Add tag');
      await act(async () => {
        fireEvent.change(tagInput, { target: { value: 'urgent' } });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockRepo.update).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        fireEvent.click(within(inspector).getByRole('button', { name: 'Remove test tag' }));
      });
      expect(mockRepo.update).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFirstUpdate(makePrompt({ id: 'prompt-1', tags: ['test', 'urgent'] }));
        await firstUpdate;
      });

      await waitFor(() => {
        expect(mockRepo.update).toHaveBeenCalledTimes(2);
      });
      expect(updateCalls[1]).toEqual({
        id: 'prompt-1',
        changes: { tags: ['urgent'] },
      });
    });

    it('changing the folder in the inspector updates the prompt folder', async () => {
      const { mockRepo } = await renderOnLibraryScreen();

      await selectPromptCard('prompt-1');

      const inspector = screen.getByRole('complementary', { name: 'Prompt details' });
      await act(async () => {
        fireEvent.click(within(inspector).getByRole('combobox', { name: 'Folder' }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('option', { name: 'Engineering' }));
      });

      await waitFor(() => {
        expect(mockRepo.update).toHaveBeenCalledWith('prompt-1', { folderId: 'folder-engineering' });
      });
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
      expect(mockCopyToClipboard).toHaveBeenCalledWith('Hello world');
    });

  });
});
