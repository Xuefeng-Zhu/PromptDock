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
  it('renders "Library" section with "All Prompts" item', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Library')).toBeDefined();
    expect(screen.getByText('All Prompts')).toBeDefined();
  });

  it('renders "Folders" section with folder names', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Folders')).toBeDefined();
    expect(screen.getByText('Writing')).toBeDefined();
    expect(screen.getByText('Product')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
  });

  it('shows folder counts for folders with prompts', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it('does not show count for folders with zero prompts', () => {
    render(<Sidebar {...defaultProps} />);
    // Engineering has no count in promptCountByFolder, so no count should appear for it
    const engineeringBtn = screen.getByText('Engineering').closest('button');
    // The count span uses tabular-nums class
    const countSpan = engineeringBtn?.querySelector('.tabular-nums');
    expect(countSpan).toBeNull();
  });

  it('highlights selected item with aria-selected', () => {
    render(<Sidebar {...defaultProps} activeItem="library" />);
    const allPromptsBtn = screen.getByText('All Prompts').closest('button');
    expect(allPromptsBtn?.getAttribute('aria-selected')).toBe('true');
  });

  it('does not highlight non-selected items', () => {
    render(<Sidebar {...defaultProps} activeItem="library" />);
    const writingBtn = screen.getByText('Writing').closest('button');
    expect(writingBtn?.getAttribute('aria-selected')).toBe('false');
  });

  it('highlights a folder when it is the active item', () => {
    render(<Sidebar {...defaultProps} activeItem="folder-writing" />);
    const writingBtn = screen.getByText('Writing').closest('button');
    expect(writingBtn?.getAttribute('aria-selected')).toBe('true');
    // Library should not be selected
    const allPromptsBtn = screen.getByText('All Prompts').closest('button');
    expect(allPromptsBtn?.getAttribute('aria-selected')).toBe('false');
  });

  it('calls onItemSelect when clicking a sidebar item', () => {
    const onItemSelect = vi.fn();
    render(<Sidebar {...defaultProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('Writing'));
    expect(onItemSelect).toHaveBeenCalledWith('folder-writing');
  });

  it('calls onItemSelect with "library" when clicking All Prompts', () => {
    const onItemSelect = vi.fn();
    render(<Sidebar {...defaultProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('All Prompts'));
    expect(onItemSelect).toHaveBeenCalledWith('library');
  });

  it('renders "Tags" section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Tags')).toBeDefined();
    expect(screen.getByText('All Tags')).toBeDefined();
  });

  it('renders "Workspaces" section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Workspaces')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
  });

  it('renders as a nav element with aria-label', () => {
    render(<Sidebar {...defaultProps} />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeDefined();
  });
});
