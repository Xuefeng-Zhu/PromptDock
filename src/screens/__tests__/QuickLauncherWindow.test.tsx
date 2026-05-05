// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { PromptRecipe, UserSettings } from '../../types/index';
import type { IPromptRepository, ISettingsRepository } from '../../repositories/interfaces';
import { initPromptStore } from '../../stores/prompt-store';
import { DEFAULT_SETTINGS, initSettingsStore } from '../../stores/settings-store';

// ─── Tauri mock ────────────────────────────────────────────────────────────────

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// ─── Clipboard utility mocks ──────────────────────────────────────────────────

const { mockCopyToClipboard, mockPasteToActiveApp } = vi.hoisted(() => ({
  mockCopyToClipboard: vi.fn(() => Promise.resolve()),
  mockPasteToActiveApp: vi.fn(async (_text: string, beforePaste?: () => Promise<void>) => {
    await beforePaste?.();
    return { copied: true, pasted: true };
  }),
}));

vi.mock('../../utils/clipboard', () => ({
  copyToClipboard: mockCopyToClipboard,
  pasteToActiveApp: mockPasteToActiveApp,
}));

import { QuickLauncherWindow } from '../QuickLauncherWindow';

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello world',
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

const PROMPT_NO_VARS = makePrompt({
  id: 'prompt-no-vars',
  title: 'Simple Prompt',
  description: 'No variables here',
  body: 'Just plain text content',
  tags: ['simple'],
});

const PROMPT_WITH_VARS = makePrompt({
  id: 'prompt-with-vars',
  title: 'Variable Prompt',
  description: 'Has template variables',
  body: 'Hello {{name}}, welcome to {{place}}',
  tags: ['template'],
});

function createMockRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
  const prompts = [...initialPrompts];
  return {
    getAll: vi.fn(async () => prompts.map((p) => ({ ...p }))),
    getById: vi.fn(async (id) => prompts.find((p) => p.id === id) ?? null),
    create: vi.fn(async (data) => {
      const created = { ...data, id: `new-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() } as PromptRecipe;
      prompts.push(created);
      return created;
    }),
    update: vi.fn(async (id, changes) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Not found: ${id}`);
      const updated = { ...prompts[idx], ...changes, updatedAt: new Date() };
      prompts[idx] = updated;
      return updated;
    }),
    delete: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    restore: vi.fn(async () => {}),
    duplicate: vi.fn(async (id) => {
      const orig = prompts.find((p) => p.id === id);
      if (!orig) throw new Error(`Not found: ${id}`);
      const dup = { ...orig, id: `dup-${Date.now()}`, title: `Copy of ${orig.title}` };
      prompts.push(dup);
      return dup;
    }),
    toggleFavorite: vi.fn(async (id) => {
      const idx = prompts.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Not found: ${id}`);
      prompts[idx] = { ...prompts[idx], favorite: !prompts[idx].favorite };
      return prompts[idx];
    }),
  };
}

function createMockSettingsRepo(
  settings: UserSettings = { ...DEFAULT_SETTINGS },
): ISettingsRepository {
  let currentSettings = { ...settings };
  return {
    get: vi.fn(async () => ({ ...currentSettings })),
    update: vi.fn(async (changes) => {
      currentSettings = { ...currentSettings, ...changes };
      return { ...currentSettings };
    }),
  };
}

async function setupStore(
  prompts: PromptRecipe[] = [PROMPT_NO_VARS, PROMPT_WITH_VARS],
  settings: UserSettings = { ...DEFAULT_SETTINGS },
) {
  const repo = createMockRepo(prompts);
  const store = initPromptStore(repo);
  const settingsStore = initSettingsStore(createMockSettingsRepo(settings));
  await store.getState().loadPrompts();
  await settingsStore.getState().loadSettings();
  return store;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('QuickLauncherWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue(undefined);
    mockCopyToClipboard.mockReset();
    mockCopyToClipboard.mockResolvedValue(undefined);
    mockPasteToActiveApp.mockReset();
    mockPasteToActiveApp.mockImplementation(
      async (_text: string, beforePaste?: () => Promise<void>) => {
        await beforePaste?.();
        return { copied: true, pasted: true };
      },
    );
  });

  describe('12.1 — reads prompts from PromptStore', () => {
    it('displays prompts from the store in the results list', async () => {
      await setupStore();
      render(<QuickLauncherWindow />);

      // With empty query, SearchEngine returns all non-archived prompts
      expect(screen.getByText('Simple Prompt')).toBeDefined();
      expect(screen.getByText('Variable Prompt')).toBeDefined();
    });

    it('filters prompts when a search query is entered', async () => {
      await setupStore();
      render(<QuickLauncherWindow />);

      const input = screen.getByLabelText('Search prompts');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Simple' } });
      });

      expect(screen.getByText('Simple Prompt')).toBeDefined();
      expect(screen.queryByText('Variable Prompt')).toBeNull();
    });
  });

  describe('12.2 — prompt selection uses copyToClipboard()', () => {
    it('calls copyToClipboard when selecting a prompt without variables', async () => {
      const store = await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      const promptButton = screen.getByText('Simple Prompt');
      await act(async () => {
        fireEvent.click(promptButton);
      });

      expect(mockCopyToClipboard).toHaveBeenCalledWith('Just plain text content');
      await waitFor(() => {
        expect(store.getState().prompts.find((p) => p.id === 'prompt-no-vars')?.lastUsedAt)
          .toBeInstanceOf(Date);
      });
    });

    it('shows an error and keeps the window open when copying fails', async () => {
      mockCopyToClipboard.mockRejectedValueOnce(new Error('clipboard denied'));
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.click(screen.getByText('Simple Prompt'));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.getByText('Simple Prompt')).toBeDefined();
      expect(mockInvoke).not.toHaveBeenCalledWith('toggle_quick_launcher');
    });

    it('calls copyToClipboard via Enter key on highlighted prompt', async () => {
      await setupStore([PROMPT_NO_VARS], {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      const input = screen.getByLabelText('Search prompts');
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(mockCopyToClipboard).toHaveBeenCalledWith('Just plain text content');
    });
  });

  describe('12.3 — VariableFillModal integration with clipboard utilities', () => {
    it('opens VariableFillModal when selecting a prompt with variables', async () => {
      await setupStore();
      render(<QuickLauncherWindow />);

      const promptButton = screen.getByText('Variable Prompt');
      await act(async () => {
        fireEvent.click(promptButton);
      });

      // VariableFillModal should be visible with variable inputs
      expect(screen.getByLabelText('Value for variable name')).toBeDefined();
      expect(screen.getByLabelText('Value for variable place')).toBeDefined();
    });

    it('calls copyToClipboard when Copy is clicked in VariableFillModal', async () => {
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      // Select the prompt with variables
      await act(async () => {
        fireEvent.click(screen.getByText('Variable Prompt'));
      });

      // Fill in variables
      await act(async () => {
        fireEvent.change(screen.getByLabelText('Value for variable name'), {
          target: { value: 'Alice' },
        });
        fireEvent.change(screen.getByLabelText('Value for variable place'), {
          target: { value: 'Wonderland' },
        });
      });

      // Click Copy
      const copyButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockCopyToClipboard).toHaveBeenCalledWith('Hello Alice, welcome to Wonderland');
    });

    it('does not show copied success when Copy fails in VariableFillModal', async () => {
      mockCopyToClipboard.mockRejectedValueOnce(new Error('clipboard denied'));
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.click(screen.getByText('Variable Prompt'));
      });

      await act(async () => {
        fireEvent.change(screen.getByLabelText('Value for variable name'), {
          target: { value: 'Alice' },
        });
        fireEvent.change(screen.getByLabelText('Value for variable place'), {
          target: { value: 'Wonderland' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Copy to Clipboard/i }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });
      expect(screen.queryByText('Copied!')).toBeNull();
      expect(mockInvoke).not.toHaveBeenCalledWith('toggle_quick_launcher');
    });

    it('does not show Paste in VariableFillModal', async () => {
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      // Select the prompt with variables
      await act(async () => {
        fireEvent.click(screen.getByText('Variable Prompt'));
      });

      // Fill in variables
      await act(async () => {
        fireEvent.change(screen.getByLabelText('Value for variable name'), {
          target: { value: 'Bob' },
        });
        fireEvent.change(screen.getByLabelText('Value for variable place'), {
          target: { value: 'Office' },
        });
      });

      expect(screen.queryByRole('button', { name: /Paste/i })).toBeNull();
      expect(mockPasteToActiveApp).not.toHaveBeenCalled();
    });

    it('uses paste as the VariableFillModal primary action when configured', async () => {
      await setupStore([PROMPT_NO_VARS, PROMPT_WITH_VARS], {
        ...DEFAULT_SETTINGS,
        defaultAction: 'paste',
      });
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.click(screen.getByText('Variable Prompt'));
      });

      await act(async () => {
        fireEvent.change(screen.getByLabelText('Value for variable name'), {
          target: { value: 'Bob' },
        });
        fireEvent.change(screen.getByLabelText('Value for variable place'), {
          target: { value: 'Office' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Paste into Active App/i }));
      });

      expect(mockPasteToActiveApp).toHaveBeenCalledWith(
        'Hello Bob, welcome to Office',
        expect.any(Function),
      );
      expect(mockCopyToClipboard).not.toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('toggle_quick_launcher');
    });
  });

  describe('12.4 — hides window after copy/paste action', () => {
    it('invokes toggle_quick_launcher after copying a prompt without variables', async () => {
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.click(screen.getByText('Simple Prompt'));
      });

      expect(mockInvoke).toHaveBeenCalledWith('toggle_quick_launcher');
    });

    it('invokes toggle_quick_launcher after Copy in VariableFillModal', async () => {
      await setupStore(undefined, {
        ...DEFAULT_SETTINGS,
        defaultAction: 'copy',
      });
      render(<QuickLauncherWindow />);

      // Select prompt with variables
      await act(async () => {
        fireEvent.click(screen.getByText('Variable Prompt'));
      });

      // Fill variables
      await act(async () => {
        fireEvent.change(screen.getByLabelText('Value for variable name'), {
          target: { value: 'Alice' },
        });
        fireEvent.change(screen.getByLabelText('Value for variable place'), {
          target: { value: 'Wonderland' },
        });
      });

      // Click Copy
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Copy to Clipboard/i }));
      });

      expect(mockInvoke).toHaveBeenCalledWith('toggle_quick_launcher');
    });

    it('uses the paste action for prompt selection by default', async () => {
      await setupStore([PROMPT_NO_VARS]);
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.click(screen.getByText('Simple Prompt'));
      });

      expect(mockPasteToActiveApp).toHaveBeenCalledWith(
        'Just plain text content',
        expect.any(Function),
      );
      expect(mockInvoke).toHaveBeenCalledWith('toggle_quick_launcher');
    });

    it('hides window on Escape key press', async () => {
      await setupStore();
      render(<QuickLauncherWindow />);

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(mockInvoke).toHaveBeenCalledWith('toggle_quick_launcher');
    });
  });
});
