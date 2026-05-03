// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StoreApi } from 'zustand';
import type { UserSettings, PromptRecipe } from '../../../types/index';
import type { ISettingsRepository, IPromptRepository } from '../../../repositories/interfaces';
import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  type SettingsStore,
} from '../../../stores/settings-store';
import {
  createPromptStore,
  type PromptStore,
} from '../../../stores/prompt-store';
import {
  createAppModeStore,
  type AppModeStore,
} from '../../../stores/app-mode-store';
import { LibraryScreen } from '../../library';
import { SettingsScreen } from '../../settings';
import { SyncStatusBar } from '../../sync';

// ─── Mock stores ───────────────────────────────────────────────────────────────

let testSettingsStore: StoreApi<SettingsStore>;
let testPromptStore: StoreApi<PromptStore>;
let testAppModeStore: StoreApi<AppModeStore>;
let mockSettingsRepo: ISettingsRepository;
let mockPromptRepo: IPromptRepository;

function createMockSettingsRepo(initial: UserSettings = { ...DEFAULT_SETTINGS }): ISettingsRepository {
  let settings = { ...initial };
  return {
    get: vi.fn(async () => ({ ...settings })),
    update: vi.fn(async (changes: Partial<UserSettings>) => {
      settings = { ...settings, ...changes };
      return { ...settings };
    }),
  };
}

function createMockPromptRepo(initialPrompts: PromptRecipe[] = []): IPromptRepository {
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

vi.mock('../../../stores/settings-store', async () => {
  const actual = await vi.importActual<typeof import('../../../stores/settings-store')>(
    '../../../stores/settings-store',
  );
  return {
    ...actual,
    useSettingsStore: (selector?: (state: SettingsStore) => unknown) => {
      const { useStore } = require('zustand');
      return selector ? useStore(testSettingsStore, selector) : useStore(testSettingsStore);
    },
  };
});

vi.mock('../../../stores/app-mode-store', async () => {
  const actual = await vi.importActual<typeof import('../../../stores/app-mode-store')>(
    '../../../stores/app-mode-store',
  );
  return {
    ...actual,
    useAppModeStore: (selector?: (state: AppModeStore) => unknown) => {
      const { useStore } = require('zustand');
      return selector ? useStore(testAppModeStore, selector) : useStore(testAppModeStore);
    },
  };
});

vi.mock('../../../stores/prompt-store', async () => {
  const actual = await vi.importActual<typeof import('../../../stores/prompt-store')>(
    '../../../stores/prompt-store',
  );
  return {
    ...actual,
    usePromptStore: (selector?: (state: PromptStore) => unknown) => {
      const { useStore } = require('zustand');
      return selector ? useStore(testPromptStore, selector) : useStore(testPromptStore);
    },
  };
});

vi.mock('../../../utils/hotkey', () => ({
  registerHotkey: vi.fn(async () => {}),
}));

vi.mock('../../../utils/file-dialog', () => ({
  saveFile: vi.fn(async () => true),
  openFile: vi.fn(async () => null),
}));

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  mockSettingsRepo = createMockSettingsRepo();
  testSettingsStore = createSettingsStore(mockSettingsRepo);
  mockPromptRepo = createMockPromptRepo();
  testPromptStore = createPromptStore(mockPromptRepo);
  testAppModeStore = createAppModeStore();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── LibraryScreen skeleton loading ────────────────────────────────────────────

describe('LibraryScreen loading state', () => {
  const defaultProps = {
    prompts: [],
    selectedPromptId: null,
    activeFilter: 'all' as const,
    onSelectPrompt: vi.fn(),
    onToggleFavorite: vi.fn(),
    onFilterChange: vi.fn(),
    onNewPrompt: vi.fn(),
    categoryColorMap: {} as Record<string, string>,
  };

  it('displays skeleton cards when loading is true', () => {
    render(<LibraryScreen {...defaultProps} loading={true} />);
    const skeletonCards = screen.getAllByTestId('skeleton-card');
    expect(skeletonCards.length).toBe(6);
  });

  it('does not display skeleton cards when loading is false', () => {
    render(<LibraryScreen {...defaultProps} loading={false} />);
    expect(screen.queryByTestId('skeleton-card')).toBeNull();
  });

  it('skeleton cards have animate-pulse class for animation', () => {
    render(<LibraryScreen {...defaultProps} loading={true} />);
    const skeletonCards = screen.getAllByTestId('skeleton-card');
    skeletonCards.forEach((card) => {
      expect(card.className).toContain('animate-pulse');
    });
  });

  it('does not render PromptGrid when loading', () => {
    render(<LibraryScreen {...defaultProps} loading={true} />);
    // PromptGrid would render "No prompts found" for empty prompts
    expect(screen.queryByText('No prompts found')).toBeNull();
  });
});

// ─── SettingsScreen placeholder loading ────────────────────────────────────────

describe('SettingsScreen loading state', () => {
  it('displays placeholder content when loading is true', () => {
    render(<SettingsScreen onBack={() => {}} loading={true} />);
    const placeholders = screen.getAllByTestId('settings-placeholder');
    expect(placeholders.length).toBe(4);
  });

  it('placeholder cards have animate-pulse class', () => {
    render(<SettingsScreen onBack={() => {}} loading={true} />);
    const placeholders = screen.getAllByTestId('settings-placeholder');
    placeholders.forEach((el) => {
      expect(el.className).toContain('animate-pulse');
    });
  });

  it('does not display settings cards when loading', () => {
    render(<SettingsScreen onBack={() => {}} loading={true} />);
    // The Account card heading should not be visible
    expect(screen.queryByText('Account')).toBeNull();
  });

  it('displays settings cards when loading is false', () => {
    render(<SettingsScreen onBack={() => {}} loading={false} />);
    expect(screen.queryByTestId('settings-placeholder')).toBeNull();
    // Normal content should be visible
    expect(screen.getByText('Settings')).toBeDefined();
  });
});

// ─── SyncStatusBar syncing indicator ───────────────────────────────────────────

describe('SyncStatusBar syncing indicator', () => {
  it('displays "Syncing…" text when syncStatus is syncing', () => {
    render(
      <SyncStatusBar
        syncStatus="syncing"
        lastSyncedAt={null}
      />,
    );
    expect(screen.getByText('Syncing…')).toBeDefined();
  });

  it('does not display "Syncing…" text when syncStatus is local', () => {
    render(
      <SyncStatusBar
        syncStatus="local"
        lastSyncedAt={null}
      />,
    );
    expect(screen.queryByText('Syncing…')).toBeNull();
  });

  it('does not display "Syncing…" text when syncStatus is synced', () => {
    render(
      <SyncStatusBar
        syncStatus="synced"
        lastSyncedAt={new Date()}
      />,
    );
    expect(screen.queryByText('Syncing…')).toBeNull();
  });

  it('displays the syncing icon (🔄) when syncing', () => {
    render(
      <SyncStatusBar
        syncStatus="syncing"
        lastSyncedAt={null}
      />,
    );
    expect(screen.getByText('🔄')).toBeDefined();
  });

  it('has aria-label indicating sync status', () => {
    render(
      <SyncStatusBar
        syncStatus="syncing"
        lastSyncedAt={null}
      />,
    );
    const statusEl = screen.getByRole('status');
    expect(statusEl.getAttribute('aria-label')).toContain('Syncing');
  });
});

// ─── PromptStore loading state ─────────────────────────────────────────────────

describe('PromptStore isLoading state', () => {
  it('isLoading is false initially', () => {
    expect(testPromptStore.getState().isLoading).toBe(false);
  });

  it('isLoading becomes true during loadPrompts and false after', async () => {
    // Track loading state changes
    const loadingStates: boolean[] = [];
    const unsub = testPromptStore.subscribe((state) => {
      loadingStates.push(state.isLoading);
    });

    await testPromptStore.getState().loadPrompts();
    unsub();

    // Should have been set to true then false
    expect(loadingStates).toContain(true);
    expect(loadingStates[loadingStates.length - 1]).toBe(false);
  });
});

// ─── SettingsStore loading state ───────────────────────────────────────────────

describe('SettingsStore isLoading state', () => {
  it('isLoading is false initially', () => {
    expect(testSettingsStore.getState().isLoading).toBe(false);
  });

  it('isLoading becomes true during loadSettings and false after', async () => {
    const loadingStates: boolean[] = [];
    const unsub = testSettingsStore.subscribe((state) => {
      loadingStates.push(state.isLoading);
    });

    await testSettingsStore.getState().loadSettings();
    unsub();

    expect(loadingStates).toContain(true);
    expect(loadingStates[loadingStates.length - 1]).toBe(false);
  });
});
