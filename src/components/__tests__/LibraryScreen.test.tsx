// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // Count appears in both header and status bar
    const countElements = screen.getAllByText('6 prompts');
    expect(countElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders filter chips with icons', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Recent')).toBeDefined();
    expect(screen.getByText('Filters')).toBeDefined();
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

  it('renders bottom status bar with sort indicator', () => {
    render(<LibraryScreen {...defaultProps} />);
    expect(screen.getByText(/Sorted by Last used/)).toBeDefined();
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

  it('calls onFilterChange when a filter chip is clicked', () => {
    const onFilterChange = vi.fn();
    render(<LibraryScreen {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Favorites'));
    expect(onFilterChange).toHaveBeenCalledWith('favorites');
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

  it('highlights the active filter chip', () => {
    render(<LibraryScreen {...defaultProps} activeFilter="favorites" />);
    const favoritesButton = screen.getByText('Favorites').closest('button');
    expect(favoritesButton?.getAttribute('aria-pressed')).toBe('true');
    const allButton = screen.getByText('All').closest('button');
    expect(allButton?.getAttribute('aria-pressed')).toBe('false');
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
