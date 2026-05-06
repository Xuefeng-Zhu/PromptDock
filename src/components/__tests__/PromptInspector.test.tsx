// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInspector } from '../prompt-inspector';
import { MOCK_PROMPTS, MOCK_FOLDERS } from '../../data/mock-data';

const mockPrompt = MOCK_PROMPTS[0]; // "Summarize Text"
const mockFolder = MOCK_FOLDERS[0]; // "Writing"

describe('PromptInspector', () => {
  it('renders the prompt title and description', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={['audience', 'text', 'format']} />
    );
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText(/Condense long text/)).toBeDefined();
  });

  it('renders tags with # prefix', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('#summarization')).toBeDefined();
    expect(screen.getByText('#writing')).toBeDefined();
  });

  it('renders metadata rows', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Last used')).toBeDefined();
    expect(screen.getByText('Created')).toBeDefined();
    expect(screen.getByText('Updated')).toBeDefined();
    expect(screen.getByText('Folder')).toBeDefined();
    expect(screen.getByText('Writing')).toBeDefined();
  });

  it('renders folder and tags editors above date metadata', () => {
    render(
      <PromptInspector
        prompt={mockPrompt}
        folder={mockFolder}
        folders={MOCK_FOLDERS}
        variables={[]}
        onUpdateFolder={vi.fn()}
        onUpdateTags={vi.fn()}
      />
    );

    const folderControl = screen.getByRole('combobox', { name: 'Folder' });
    const addTagButton = screen.getByRole('button', { name: 'Add tag' });
    const lastUsedLabel = screen.getByText('Last used');

    expect(folderControl.compareDocumentPosition(addTagButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(addTagButton.compareDocumentPosition(lastUsedLabel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('renders the prompt body section with Copy button', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Prompt')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
    expect(screen.getByText(/Summarize the following text/)).toBeDefined();
  });

  it('renders collapsible Variables section when variables exist', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={['audience', 'text', 'format']} />
    );
    expect(screen.getByText('Variables (3)')).toBeDefined();
  });

  it('renders favorite star and more options buttons', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByRole('button', { name: /favorites/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'More options' })).toBeDefined();
  });

  describe('action callbacks', () => {
    it('calls onToggleFavorite with prompt id when star button is clicked', () => {
      const onToggleFavorite = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onToggleFavorite={onToggleFavorite}
        />
      );
      const starBtn = screen.getByRole('button', { name: /favorites/i });
      fireEvent.click(starBtn);
      expect(onToggleFavorite).toHaveBeenCalledTimes(1);
      expect(onToggleFavorite).toHaveBeenCalledWith(mockPrompt.id);
    });

    it('calls onCopyBody with prompt body when Copy button is clicked', () => {
      const onCopyBody = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onCopyBody={onCopyBody}
        />
      );
      const copyBtn = screen.getByRole('button', { name: 'Copy prompt body' });
      fireEvent.click(copyBtn);
      expect(onCopyBody).toHaveBeenCalledTimes(1);
      expect(onCopyBody).toHaveBeenCalledWith(mockPrompt.body, mockPrompt.id);
    });

    it('calls onUpdateTags with a new tag when a tag is added inline', () => {
      const onUpdateTags = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onUpdateTags={onUpdateTags}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
      const tagInput = screen.getByLabelText('Add tag');
      fireEvent.change(tagInput, { target: { value: 'new-tag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(onUpdateTags).toHaveBeenCalledTimes(1);
      const updateTags = onUpdateTags.mock.calls[0][1];
      expect(onUpdateTags.mock.calls[0][0]).toBe(mockPrompt.id);
      expect(updateTags(mockPrompt.tags)).toEqual([
        ...mockPrompt.tags,
        'new-tag',
      ]);
    });

    it('calls onUpdateTags without the removed tag when a tag is removed inline', () => {
      const onUpdateTags = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onUpdateTags={onUpdateTags}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Remove summarization tag' }));

      expect(onUpdateTags).toHaveBeenCalledTimes(1);
      const updateTags = onUpdateTags.mock.calls[0][1];
      expect(onUpdateTags.mock.calls[0][0]).toBe(mockPrompt.id);
      expect(updateTags(mockPrompt.tags)).toEqual(['writing']);
    });

    it('composes rapid tag updates from the latest tag list', () => {
      const onUpdateTags = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onUpdateTags={onUpdateTags}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
      const tagInput = screen.getByLabelText('Add tag');
      fireEvent.change(tagInput, { target: { value: 'new-tag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      fireEvent.click(screen.getByRole('button', { name: 'Remove summarization tag' }));

      const addTag = onUpdateTags.mock.calls[0][1];
      const removeTag = onUpdateTags.mock.calls[1][1];
      expect(removeTag(addTag(mockPrompt.tags))).toEqual(['writing', 'new-tag']);
    });

    it('calls onUpdateFolder when a folder is selected inline', () => {
      const onUpdateFolder = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          folders={MOCK_FOLDERS}
          variables={[]}
          onUpdateFolder={onUpdateFolder}
        />
      );

      fireEvent.click(screen.getByRole('combobox', { name: 'Folder' }));
      fireEvent.click(screen.getByRole('option', { name: 'Engineering' }));

      expect(onUpdateFolder).toHaveBeenCalledTimes(1);
      expect(onUpdateFolder).toHaveBeenCalledWith(mockPrompt.id, 'folder-engineering');
    });

    it('calls onUpdateFolder with null when No folder is selected inline', () => {
      const onUpdateFolder = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          folders={MOCK_FOLDERS}
          variables={[]}
          onUpdateFolder={onUpdateFolder}
        />
      );

      fireEvent.click(screen.getByRole('combobox', { name: 'Folder' }));
      fireEvent.click(screen.getByRole('option', { name: 'No folder' }));

      expect(onUpdateFolder).toHaveBeenCalledTimes(1);
      expect(onUpdateFolder).toHaveBeenCalledWith(mockPrompt.id, null);
    });

    it('calls onEdit with prompt id and closes dropdown when "Edit prompt" is clicked', () => {
      const onEdit = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onEdit={onEdit}
        />
      );
      // Open the dropdown
      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      expect(screen.getByRole('menu')).toBeDefined();

      // Click "Edit prompt"
      fireEvent.click(screen.getByRole('menuitem', { name: 'Edit prompt' }));
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockPrompt.id);
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('calls onEdit with prompt id when "Add tag" is clicked', () => {
      const onEdit = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onEdit={onEdit}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockPrompt.id);
    });

    it('calls onDuplicate with prompt id and closes dropdown when "Duplicate" is clicked', () => {
      const onDuplicate = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onDuplicate={onDuplicate}
        />
      );
      // Open the dropdown
      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      expect(screen.getByRole('menu')).toBeDefined();

      // Click "Duplicate"
      fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
      expect(onDuplicate).toHaveBeenCalledTimes(1);
      expect(onDuplicate).toHaveBeenCalledWith(mockPrompt.id);
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('calls onArchive with prompt id and closes dropdown when "Archive" is clicked', () => {
      const onArchive = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onArchive={onArchive}
        />
      );
      // Open the dropdown
      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      expect(screen.getByRole('menu')).toBeDefined();

      // Click "Archive"
      fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
      expect(onArchive).toHaveBeenCalledTimes(1);
      expect(onArchive).toHaveBeenCalledWith(mockPrompt.id);
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('confirms before calling onDelete from the actions menu', () => {
      const onDelete = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onDelete={onDelete}
        />
      );
      // Open the dropdown
      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      expect(screen.getByRole('menu')).toBeDefined();

      // Click "Delete"
      fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: /Delete/i })).toBeDefined();
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockPrompt.id);
    });

    it('does not throw when callbacks are not provided and buttons are clicked', () => {
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
        />
      );
      // Click star - should not throw
      fireEvent.click(screen.getByRole('button', { name: /favorites/i }));
      // Click copy - should not throw
      fireEvent.click(screen.getByRole('button', { name: 'Copy prompt body' }));
      // Open dropdown and click items - should not throw
      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Edit prompt' }));
    });
  });
});
