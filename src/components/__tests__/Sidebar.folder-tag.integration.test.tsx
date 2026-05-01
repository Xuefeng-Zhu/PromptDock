// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { PromptEditor } from '../PromptEditor';
import { createFolder, readFolders, writeFolders } from '../../utils/folder-storage';
import type { Folder } from '../../types/index';

// ─── Folder Creation Integration Tests ─────────────────────────────────────────

describe('Sidebar folder creation', () => {
  const mockFolders: Folder[] = [
    { id: 'folder-writing', name: 'Writing', createdAt: new Date(), updatedAt: new Date() },
  ];

  const defaultProps = {
    folders: mockFolders,
    activeItem: 'library',
    onItemSelect: vi.fn(),
    promptCountByFolder: {} as Record<string, number>,
    onCreateFolder: vi.fn(),
  };

  it('shows inline input when "+" button is clicked in Folders section', () => {
    render(<Sidebar {...defaultProps} />);
    // Click the "+" button in the Folders section
    const addFolderBtn = screen.getByRole('button', { name: 'Add folders' });
    fireEvent.click(addFolderBtn);
    // The inline input should appear
    expect(screen.getByLabelText('New folder name')).toBeDefined();
  });

  it('does not show inline input initially', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.queryByLabelText('New folder name')).toBeNull();
  });

  it('calls onCreateFolder with folder name when Enter is pressed', () => {
    const onCreateFolder = vi.fn();
    render(<Sidebar {...defaultProps} onCreateFolder={onCreateFolder} />);
    // Open the input
    fireEvent.click(screen.getByRole('button', { name: 'Add folders' }));
    const input = screen.getByLabelText('New folder name');
    // Type a folder name
    fireEvent.change(input, { target: { value: 'My New Folder' } });
    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCreateFolder).toHaveBeenCalledWith('My New Folder');
  });

  it('calls onCreateFolder with folder name on blur', () => {
    const onCreateFolder = vi.fn();
    render(<Sidebar {...defaultProps} onCreateFolder={onCreateFolder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add folders' }));
    const input = screen.getByLabelText('New folder name');
    fireEvent.change(input, { target: { value: 'Blurred Folder' } });
    fireEvent.blur(input);
    expect(onCreateFolder).toHaveBeenCalledWith('Blurred Folder');
  });

  it('does not call onCreateFolder when input is empty', () => {
    const onCreateFolder = vi.fn();
    render(<Sidebar {...defaultProps} onCreateFolder={onCreateFolder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add folders' }));
    const input = screen.getByLabelText('New folder name');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCreateFolder).not.toHaveBeenCalled();
  });

  it('hides inline input when Escape is pressed', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add folders' }));
    const input = screen.getByLabelText('New folder name');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByLabelText('New folder name')).toBeNull();
  });

  it('hides inline input after successful submission', () => {
    const onCreateFolder = vi.fn();
    render(<Sidebar {...defaultProps} onCreateFolder={onCreateFolder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add folders' }));
    const input = screen.getByLabelText('New folder name');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.queryByLabelText('New folder name')).toBeNull();
  });
});

// ─── Folder Persistence Tests ──────────────────────────────────────────────────

describe('Folder persistence (folder-storage utility)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('createFolder persists a folder to localStorage', () => {
    const folder = createFolder('Test Folder');
    expect(folder.name).toBe('Test Folder');
    expect(folder.id).toContain('folder-');
    const stored = readFolders();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Test Folder');
  });

  it('readFolders returns empty array when no folders exist', () => {
    expect(readFolders()).toEqual([]);
  });

  it('writeFolders and readFolders round-trip correctly', () => {
    const folders: Folder[] = [
      { id: 'f1', name: 'Alpha', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
      { id: 'f2', name: 'Beta', createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') },
    ];
    writeFolders(folders);
    const result = readFolders();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alpha');
    expect(result[1].name).toBe('Beta');
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('createFolder appends to existing folders', () => {
    createFolder('First');
    createFolder('Second');
    const stored = readFolders();
    expect(stored).toHaveLength(2);
    expect(stored[0].name).toBe('First');
    expect(stored[1].name).toBe('Second');
  });
});

// ─── Tag Persistence Integration Tests ─────────────────────────────────────────

describe('PromptEditor tag persistence', () => {
  const mockFolders: Folder[] = [
    { id: 'folder-1', name: 'General', createdAt: new Date(), updatedAt: new Date() },
  ];

  it('includes tags in onSave data when tags are added', () => {
    const onSave = vi.fn();
    render(
      <PromptEditor
        folders={mockFolders}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Prompt' } });

    // Add a tag
    const addTagBtn = screen.getByRole('button', { name: 'Add tag' });
    fireEvent.click(addTagBtn);
    const tagInput = screen.getByLabelText('Add tag');
    fireEvent.change(tagInput, { target: { value: 'my-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Save
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedData = onSave.mock.calls[0][0];
    expect(savedData.tags).toContain('my-tag');
  });

  it('includes multiple tags in onSave data', () => {
    const onSave = vi.fn();
    render(
      <PromptEditor
        folders={mockFolders}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    // Add first tag
    const addTagBtn = screen.getByRole('button', { name: 'Add tag' });
    fireEvent.click(addTagBtn);
    let tagInput = screen.getByLabelText('Add tag');
    fireEvent.change(tagInput, { target: { value: 'tag-one' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Add second tag
    const addTagBtn2 = screen.getByRole('button', { name: 'Add tag' });
    fireEvent.click(addTagBtn2);
    tagInput = screen.getByLabelText('Add tag');
    fireEvent.change(tagInput, { target: { value: 'tag-two' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Save
    fireEvent.click(screen.getByText('Save'));

    const savedData = onSave.mock.calls[0][0];
    expect(savedData.tags).toEqual(['tag-one', 'tag-two']);
  });

  it('preserves existing tags when editing a prompt', () => {
    const onSave = vi.fn();
    const existingPrompt = {
      id: 'p1',
      workspaceId: 'local',
      title: 'Existing',
      description: 'Desc',
      body: 'Body text',
      tags: ['existing-tag'],
      folderId: null,
      favorite: false,
      archived: false,
      archivedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'local',
      version: 1,
    };

    render(
      <PromptEditor
        promptId="p1"
        prompt={existingPrompt}
        folders={mockFolders}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    // Save without modifying tags
    fireEvent.click(screen.getByText('Save'));

    const savedData = onSave.mock.calls[0][0];
    expect(savedData.tags).toContain('existing-tag');
  });

  it('includes newly added tags alongside existing tags when editing', () => {
    const onSave = vi.fn();
    const existingPrompt = {
      id: 'p1',
      workspaceId: 'local',
      title: 'Existing',
      description: 'Desc',
      body: 'Body text',
      tags: ['old-tag'],
      folderId: null,
      favorite: false,
      archived: false,
      archivedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'local',
      version: 1,
    };

    render(
      <PromptEditor
        promptId="p1"
        prompt={existingPrompt}
        folders={mockFolders}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    // Add a new tag
    const addTagBtn = screen.getByRole('button', { name: 'Add tag' });
    fireEvent.click(addTagBtn);
    const tagInput = screen.getByLabelText('Add tag');
    fireEvent.change(tagInput, { target: { value: 'new-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Save
    fireEvent.click(screen.getByText('Save'));

    const savedData = onSave.mock.calls[0][0];
    expect(savedData.tags).toContain('old-tag');
    expect(savedData.tags).toContain('new-tag');
  });
});
