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

    it('calls onEdit with prompt id and closes dropdown when "Move to folder" is clicked', () => {
      const onEdit = vi.fn();
      render(
        <PromptInspector
          prompt={mockPrompt}
          folder={mockFolder}
          variables={[]}
          onEdit={onEdit}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'More options' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Move to folder' }));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockPrompt.id);
      expect(screen.queryByRole('menu')).toBeNull();
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

    it('calls onDelete with prompt id and closes dropdown when "Delete" is clicked', () => {
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
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockPrompt.id);
      // Dropdown should be closed
      expect(screen.queryByRole('menu')).toBeNull();
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
