// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LibraryScreen } from '../LibraryScreen';
import { MOCK_PROMPTS } from '../../data/mock-data';
import type { PromptRecipe } from '../../types/index';

const defaultProps = {
  prompts: MOCK_PROMPTS,
  selectedPromptId: null,
  activeFilter: 'all' as const,
  onSelectPrompt: vi.fn(),
  onToggleFavorite: vi.fn(),
  onFilterChange: vi.fn(),
  onNewPrompt: vi.fn(),
  categoryColorMap: {} as Record<string, string>,
};

describe('LibraryScreen', () => {
  it('renders the "All Prompts" heading', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByText('All Prompts')).toBeDefined();
  });

  it('renders the prompt count', () => {
    render(<LibraryScreen {...defaultProps} />);
    const countElements = screen.getAllByText('6 prompts');
    expect(countElements).toHaveLength(1);
  });

  it('renders the Filters menu button', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Filters/ })).toBeDefined();
  });

  it('renders the New Prompt button', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByText('New Prompt')).toBeDefined();
  });

  it('renders prompt cards from the grid', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText('Code Review Assistant')).toBeDefined();
  });

  it('renders grid/list view toggle buttons', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Grid view' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'List view' })).toBeDefined();
  });

  it('switches the prompt list between grid and list layouts', () => {
    render(<LibraryScreen {...defaultProps} />);
    const promptList = screen.getByRole('listbox', { name: 'Prompt list' });
    expect(promptList.getAttribute('data-view-mode')).toBe('grid');

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(promptList.getAttribute('data-view-mode')).toBe('list');
    expect(screen.getByRole('button', { name: 'List view' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('renders the sort control with the Filters button', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Sorted by Last used/ })).toBeDefined();
  });

  it('calls onFilterChange when a sort option is selected from the right dropdown', () => {
    const onFilterChange = vi.fn();
    render(<LibraryScreen {...defaultProps} onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Sorted by Last used/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'A-Z' }));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'az' }),
    );
  });

  it('sorts prompts by A-Z when that filter is applied', () => {
    const prompts: PromptRecipe[] = [
      {
        id: 'p-z',
        workspaceId: 'local',
        title: 'Zulu Prompt',
        description: '',
        body: 'Zulu',
        tags: [],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-01-03'),
        createdBy: 'local',
        version: 1,
      },
      {
        id: 'p-a',
        workspaceId: 'local',
        title: 'Alpha Prompt',
        description: '',
        body: 'Alpha',
        tags: [],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-01-02'),
        createdBy: 'local',
        version: 1,
      },
    ];

    render(
      <LibraryScreen
        {...defaultProps}
        prompts={prompts}
        activeFilter={{
          sortBy: 'az',
          statuses: [],
          folders: [],
          tags: [],
          lastUsed: 'any',
        }}
      />,
    );

    const cards = screen.getAllByRole('option');
    expect(within(cards[0]).getByText('Alpha Prompt')).toBeDefined();
  });

  // ── Consolidated library screen tests (Task 10.5) ──────────────────────────

  it('renders with PromptStore-shaped data (non-archived prompts)', () => {
    const storePrompts: PromptRecipe[] = [
      {
        id: 'p1',
        workspaceId: 'local',
        title: 'Store Prompt One',
        description: 'First prompt from store',
        body: 'Hello {{name}}',
        tags: ['greeting'],
        folderId: 'folder-a',
        favorite: true,
        archived: false,
        archivedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastUsedAt: new Date('2024-01-03'),
        createdBy: 'local',
        version: 1,
      },
      {
        id: 'p2',
        workspaceId: 'local',
        title: 'Store Prompt Two',
        description: 'Second prompt from store',
        body: 'Goodbye',
        tags: ['farewell'],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-02'),
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      },
    ];

    render(<LibraryScreen {...defaultProps} prompts={storePrompts} />);
    expect(screen.getByText('Store Prompt One')).toBeDefined();
    expect(screen.getByText('Store Prompt Two')).toBeDefined();
    // Count should reflect the 2 prompts
    const countElements = screen.getAllByText('2 prompts');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no prompts are provided', () => {
    render(<LibraryScreen {...defaultProps} prompts={[]} />);
    expect(screen.getByText('No prompts found')).toBeDefined();
    // Count should show 0
    const countElements = screen.getAllByText('0 prompts');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders only favorite-filtered prompts when passed', () => {
    const favoritePrompts = MOCK_PROMPTS.filter((p) => p.favorite);
    render(
      <LibraryScreen
        {...defaultProps}
        prompts={favoritePrompts}
        activeFilter="favorites"
      />,
    );
    expect(screen.getByText('Summarize Text')).toBeDefined();
    // Non-favorite prompts should not appear
    expect(screen.queryByText('Code Review Assistant')).toBeNull();
  });

  it('opens the filters popover with all filter sections', () => {
    render(<LibraryScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(dialog).toBeDefined();
    expect(within(dialog).getByRole('heading', { name: 'Status' })).toBeDefined();
    expect(within(dialog).getByRole('heading', { name: 'Folders' })).toBeDefined();
    expect(within(dialog).getByRole('heading', { name: 'Tags' })).toBeDefined();
    expect(within(dialog).getByRole('heading', { name: 'Last used' })).toBeDefined();
    expect(within(dialog).queryByRole('heading', { name: 'Sort by' })).toBeNull();
  });

  it('closes the filters popover on Escape and outside click', () => {
    render(<LibraryScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();
  });

  it('calls onFilterChange when filters are applied', () => {
    const onFilterChange = vi.fn();
    render(<LibraryScreen {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Favorites only' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['favorites'] }),
    );
  });

  it('calls onNewPrompt when New Prompt button is clicked', () => {
    const onNewPrompt = vi.fn();
    render(<LibraryScreen {...defaultProps} onNewPrompt={onNewPrompt} />);
    fireEvent.click(screen.getByText('New Prompt'));
    expect(onNewPrompt).toHaveBeenCalledOnce();
  });

  it('calls onSelectPrompt when a prompt card is clicked', () => {
    const onSelectPrompt = vi.fn();
    render(<LibraryScreen {...defaultProps} onSelectPrompt={onSelectPrompt} />);
    // Click the first prompt card
    const card = screen.getByTestId('prompt-card-prompt-summarize');
    fireEvent.click(card);
    expect(onSelectPrompt).toHaveBeenCalledWith('prompt-summarize');
  });

  it('checks the active filter option', () => {
    render(<LibraryScreen {...defaultProps} activeFilter="favorites" />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    expect(screen.getByRole('checkbox', { name: 'Favorites only' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows active filter chips and removes individual chips', () => {
    render(
      <LibraryScreen
        {...defaultProps}
        activeFilter={{
          sortBy: 'lastUsed',
          statuses: ['hasVariables'],
          folders: ['writing'],
          tags: [],
          lastUsed: 'last7Days',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));

    expect(screen.getByRole('button', { name: /Remove Folder: Writing/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Remove Status: Has variables/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Remove Last used: Last 7 days/ })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Remove Folder: Writing/ }));
    expect(screen.queryByRole('button', { name: /Remove Folder: Writing/ })).toBeNull();
  });

  it('resets draft filters from the popover', () => {
    render(
      <LibraryScreen
        {...defaultProps}
        activeFilter={{
          sortBy: 'lastUsed',
          statuses: ['hasVariables'],
          folders: ['writing'],
          tags: [],
          lastUsed: 'last7Days',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.queryByRole('button', { name: /Remove Folder: Writing/ })).toBeNull();
    expect(screen.getByText('No active filters')).toBeDefined();
  });

  it('renders folder-filtered prompts correctly', () => {
    // Simulate folder filtering by passing only prompts from one folder
    const folderPrompts = MOCK_PROMPTS.filter((p) => p.folderId === 'folder-writing');
    render(<LibraryScreen {...defaultProps} prompts={folderPrompts} />);
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText('Rewrite in Clear English')).toBeDefined();
    expect(screen.queryByText('Code Review Assistant')).toBeNull();
    const countElements = screen.getAllByText('2 prompts');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders search-filtered prompts correctly', () => {
    // Simulate search filtering by passing only matching prompts
    const searchResults = MOCK_PROMPTS.filter((p) =>
      p.title.toLowerCase().includes('code'),
    );
    render(<LibraryScreen {...defaultProps} prompts={searchResults} />);
    expect(screen.getByText('Code Review Assistant')).toBeDefined();
    expect(screen.queryByText('Summarize Text')).toBeNull();
  });

  it('uses totalPromptCount prop when provided', () => {
    render(<LibraryScreen {...defaultProps} totalPromptCount={42} />);
    const countElements = screen.getAllByText('42 prompts');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
  });
});
