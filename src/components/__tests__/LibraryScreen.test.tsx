// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LibraryScreen } from '../LibraryScreen';
import { MOCK_PROMPTS } from '../../data/mock-data';

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
    expect(screen.getByText('6 prompts')).toBeDefined();
  });

  it('renders filter chips', () => {
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
});
