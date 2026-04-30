// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '../TopBar';

const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  onCommandPaletteOpen: vi.fn(),
  onSettingsOpen: vi.fn(),
};

describe('TopBar', () => {
  it('renders "PromptDock" title', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('PromptDock')).toBeDefined();
  });

  it('renders search bar with placeholder', () => {
    render(<TopBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search…');
    expect(input).toBeDefined();
    expect(input.getAttribute('type')).toBe('search');
  });

  it('renders search bar with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    expect(input).toBeDefined();
  });

  it('renders ⌘K shortcut hint', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('⌘K')).toBeDefined();
  });

  it('renders sync icon button with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const syncBtn = screen.getByRole('button', { name: 'Sync' });
    expect(syncBtn).toBeDefined();
  });

  it('renders account icon button with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const accountBtn = screen.getByRole('button', { name: 'Account' });
    expect(accountBtn).toBeDefined();
  });

  it('calls onSearchChange when typing in the search bar', () => {
    const onSearchChange = vi.fn();
    render(<TopBar {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('calls onCommandPaletteOpen when clicking the search bar', () => {
    const onCommandPaletteOpen = vi.fn();
    render(<TopBar {...defaultProps} onCommandPaletteOpen={onCommandPaletteOpen} />);
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.click(input);
    expect(onCommandPaletteOpen).toHaveBeenCalledTimes(1);
  });

  it('displays the current search query value', () => {
    render(<TopBar {...defaultProps} searchQuery="test query" />);
    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('renders as a header element', () => {
    const { container } = render(<TopBar {...defaultProps} />);
    expect(container.querySelector('header')).toBeDefined();
  });
});
