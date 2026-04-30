// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { Folder } from '../../types/index';

const mockFolders: Folder[] = [
  { id: 'folder-writing', name: 'Writing', createdAt: new Date(), updatedAt: new Date() },
  { id: 'folder-product', name: 'Product', createdAt: new Date(), updatedAt: new Date() },
  { id: 'folder-engineering', name: 'Engineering', createdAt: new Date(), updatedAt: new Date() },
];

const defaultProps = {
  folders: mockFolders,
  activeItem: 'library',
  onItemSelect: vi.fn(),
  promptCountByFolder: { 'folder-writing': 3, 'folder-product': 1 } as Record<string, number>,
};

describe('Sidebar', () => {
  it('renders "LIBRARY" section with All Prompts, Favorites, Recent, Archived', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('LIBRARY')).toBeDefined();
    expect(screen.getByText('All Prompts')).toBeDefined();
    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Recent')).toBeDefined();
    expect(screen.getByText('Archived')).toBeDefined();
  });

  it('renders "FOLDERS" section with folder names', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('FOLDERS')).toBeDefined();
    // Folders appear in the folders section (may also appear in tags)
    const writingElements = screen.getAllByText('Writing');
    expect(writingElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Product')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
  });

  it('highlights selected item with aria-selected', () => {
    render(<Sidebar {...defaultProps} activeItem="library" />);
    const allPromptsBtn = screen.getByText('All Prompts').closest('button');
    expect(allPromptsBtn?.getAttribute('aria-selected')).toBe('true');
  });

  it('calls onItemSelect when clicking a sidebar item', () => {
    const onItemSelect = vi.fn();
    render(<Sidebar {...defaultProps} onItemSelect={onItemSelect} />);
    // Click the first "Writing" element (in folders section)
    const writingElements = screen.getAllByText('Writing');
    fireEvent.click(writingElements[0]);
    expect(onItemSelect).toHaveBeenCalledWith('folder-writing');
  });

  it('calls onItemSelect with "library" when clicking All Prompts', () => {
    const onItemSelect = vi.fn();
    render(<Sidebar {...defaultProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('All Prompts'));
    expect(onItemSelect).toHaveBeenCalledWith('library');
  });

  it('renders "TAGS" section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('TAGS')).toBeDefined();
  });

  it('renders "WORKSPACES" section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('WORKSPACES')).toBeDefined();
    expect(screen.getByText('Personal')).toBeDefined();
    expect(screen.getByText('Team Workspace')).toBeDefined();
  });

  it('renders as a nav element with aria-label', () => {
    render(<Sidebar {...defaultProps} />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeDefined();
  });

  it('renders bottom toolbar with settings and dark mode toggle', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toBeDefined();
    expect(screen.getByText('⌘,')).toBeDefined();
  });
});
