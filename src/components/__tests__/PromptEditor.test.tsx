// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PromptEditor } from '../prompt-editor';
import { MOCK_PROMPTS, MOCK_FOLDERS } from '../../data/mock-data';

const defaultProps = {
  folders: MOCK_FOLDERS,
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('PromptEditor', () => {
  it('renders form fields for title, description, and body', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByLabelText('Title')).toBeDefined();
    expect(screen.getByLabelText('Description')).toBeDefined();
    expect(screen.getByLabelText('Body')).toBeDefined();
  });

  it('renders breadcrumb with Library link', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Library')).toBeDefined();
    // "New Prompt" appears in both breadcrumb and heading
    const newPromptElements = screen.getAllByText('New Prompt');
    expect(newPromptElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Edit Prompt" heading when editing an existing prompt', () => {
    render(<PromptEditor {...defaultProps} promptId="prompt-summarize" prompt={MOCK_PROMPTS[0]} />);
    expect(screen.getByText('Edit Prompt')).toBeDefined();
  });

  it('updates word and character counts when body changes', () => {
    render(<PromptEditor {...defaultProps} />);
    const bodyTextarea = screen.getByLabelText('Body');
    fireEvent.change(bodyTextarea, { target: { value: 'hello world' } });
    expect(screen.getByText(/2 words/)).toBeDefined();
    expect(screen.getByText(/11 characters/)).toBeDefined();
  });

  it('keeps large prompt bodies on the main editor scroll surface', () => {
    const largeBody = Array.from({ length: 80 }, (_, index) => `Review item ${index + 1}`).join('\n');
    render(
      <PromptEditor
        {...defaultProps}
        promptId="large-prompt"
        prompt={{ ...MOCK_PROMPTS[0], id: 'large-prompt', body: largeBody }}
      />,
    );

    const bodyTextarea = screen.getByLabelText('Body') as HTMLTextAreaElement;
    expect(bodyTextarea.rows).toBe(12);
    expect(bodyTextarea.classList.contains('overflow-auto')).toBe(false);
    expect(bodyTextarea.classList.contains('overflow-hidden')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Expand editor' }));
    expect(bodyTextarea.rows).toBe(12);
  });

  it('renders the Insert variable button', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Insert variable')).toBeDefined();
  });

  it('quick-adds existing tags from suggestions', () => {
    render(
      <PromptEditor
        {...defaultProps}
        availableTags={['writing', 'research', 'ops']}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    expect(screen.getByRole('option', { name: '#writing' })).toBeDefined();

    fireEvent.change(screen.getByLabelText('Add tag'), { target: { value: 'res' } });
    expect(screen.queryByRole('option', { name: '#writing' })).toBeNull();

    fireEvent.click(screen.getByRole('option', { name: '#research' }));
    expect(screen.getByRole('button', { name: 'Remove research tag' })).toBeDefined();
  });

  it('quick-selects existing folders from the folder field', async () => {
    const onSave = vi.fn();
    render(<PromptEditor {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Folder' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Folder' }), {
      target: { value: 'eng' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Engineering' }));

    expect(screen.getByRole('combobox', { name: 'Folder' }).textContent).toContain('Engineering');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ready' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Prompt body' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        folderId: 'folder-engineering',
      }));
    });
  });

  it('creates and selects a new folder from the folder field', async () => {
    const onCreateFolder = vi.fn((name: string) => ({
      id: 'folder-client-work',
      name,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }));
    const onSave = vi.fn();
    render(
      <PromptEditor
        {...defaultProps}
        onCreateFolder={onCreateFolder}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Folder' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Folder' }), {
      target: { value: 'Client Work' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Create "Client Work"' }));

    expect(onCreateFolder).toHaveBeenCalledWith('Client Work');
    expect(screen.getByRole('combobox', { name: 'Folder' }).textContent).toContain('Client Work');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ready' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Prompt body' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        folderId: 'folder-client-work',
      }));
    });
  });

  it('opens formatting help when Formatting help is clicked', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.queryByText('Template formatting')).toBeNull();
    fireEvent.click(screen.getByText('Formatting help'));
    expect(screen.getByText('Template formatting')).toBeDefined();
  });

  it('configures variable input controls and saves their metadata', async () => {
    const onSave = vi.fn();
    render(<PromptEditor {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Typed variables' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Write in {{tone}} about {{context}}' },
    });

    expect(screen.getByText('Variable controls')).toBeDefined();
    fireEvent.click(screen.getByRole('button', {
      name: 'Use dropdown input for tone',
    }));
    const toneOptions = screen.getByLabelText('Options for tone') as HTMLTextAreaElement;
    fireEvent.change(toneOptions, {
      target: { value: 'Friendly\n' },
    });
    expect(toneOptions.value).toBe('Friendly\n');

    fireEvent.change(toneOptions, {
      target: { value: 'Friendly\nProfessional' },
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'Use textarea input for context',
    }));
    fireEvent.change(screen.getByLabelText('Description for context'), {
      target: { value: 'Background material' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        variables: [
          {
            name: 'tone',
            defaultValue: '',
            description: '',
            inputType: 'dropdown',
            options: ['Friendly', 'Professional'],
          },
          {
            name: 'context',
            defaultValue: '',
            description: 'Background material',
            inputType: 'textarea',
            options: [],
          },
        ],
      }));
    });
  });

  it('expands the editor and restores the preview rail', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Live Preview')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Expand editor' }));
    expect(screen.queryByText('Live Preview')).toBeNull();
    expect(screen.getByRole('button', { name: 'Restore preview' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Restore preview' }));
    expect(screen.getByText('Live Preview')).toBeDefined();
  });

  it('renders action buttons including Save', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Save options' })).toBeNull();
  });

  it('shows the From JSON action on the new prompt page', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: /From JSON/ })).toBeDefined();
  });

  it('fills the form from valid JSON on the new prompt page', async () => {
    const onSave = vi.fn();
    render(
      <PromptEditor
        {...defaultProps}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /From JSON/ }));
    const dialog = screen.getByRole('dialog', { name: 'Fill prompt form from JSON' });
    fireEvent.change(within(dialog).getByLabelText('Prompt JSON'), {
      target: {
        value: JSON.stringify({
          title: 'JSON prompt',
          description: 'Imported from JSON',
          body: 'Hello {{name}}',
          tags: ['draft'],
          folder: 'Writing',
          favorite: true,
        }),
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fill Form' }));

    await waitFor(() => {
      expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('JSON prompt');
    });
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe('Imported from JSON');
    expect((screen.getByLabelText('Body') as HTMLTextAreaElement).value).toBe('Hello {{name}}');
    expect(screen.getByRole('button', { name: 'Remove draft tag' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Folder' }).textContent).toContain('Writing');
    expect(screen.queryByRole('dialog', { name: 'Fill prompt form from JSON' })).toBeNull();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        title: 'JSON prompt',
        description: 'Imported from JSON',
        body: 'Hello {{name}}',
        tags: ['draft'],
        folderId: 'folder-writing',
        favorite: true,
      }));
    });
  });

  it('shows a parse error without filling the form from invalid JSON', () => {
    render(<PromptEditor {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /From JSON/ }));
    const dialog = screen.getByRole('dialog', { name: 'Fill prompt form from JSON' });
    fireEvent.change(within(dialog).getByLabelText('Prompt JSON'), {
      target: { value: '{nope' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fill Form' }));

    expect(within(dialog).getByRole('alert').textContent).toContain(
      'Invalid JSON: unable to parse input.',
    );
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
  });

  it('shows required field errors without filling the form from JSON', () => {
    render(<PromptEditor {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /From JSON/ }));
    const dialog = screen.getByRole('dialog', { name: 'Fill prompt form from JSON' });
    fireEvent.change(within(dialog).getByLabelText('Prompt JSON'), {
      target: { value: JSON.stringify({ tags: ['draft'] }) },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fill Form' }));

    const alert = within(dialog).getByRole('alert');
    expect(alert.textContent).toContain('title is required');
    expect(alert.textContent).toContain('body is required');
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
  });

  it('requires title and body before saving', async () => {
    const onSave = vi.fn();
    render(<PromptEditor {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByText('Save'));

    expect((await screen.findByRole('alert')).textContent).toContain('Title is required');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave after required fields are present', async () => {
    const onSave = vi.fn();
    render(<PromptEditor {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ready' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Prompt body' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error when saving fails', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('disk full'));
    render(<PromptEditor {...defaultProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ready' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Prompt body' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Failed to save prompt: disk full');
    });
    expect(screen.getByText('Save')).toBeDefined();
  });

  it('shows edit actions and the body copy action when editing', () => {
    render(
      <PromptEditor
        {...defaultProps}
        promptId="prompt-summarize"
        prompt={MOCK_PROMPTS[0]}
        onDuplicate={vi.fn()}
        onArchive={vi.fn()}
        onCopy={vi.fn()}
      />,
    );
    expect(screen.getByText('Duplicate')).toBeDefined();
    expect(screen.getByText('Archive')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeDefined();
  });

  it('does not show the From JSON action when editing', () => {
    render(
      <PromptEditor
        {...defaultProps}
        promptId="prompt-summarize"
        prompt={MOCK_PROMPTS[0]}
      />,
    );
    expect(screen.queryByRole('button', { name: /From JSON/ })).toBeNull();
  });

  it('shows metadata footer when editing', () => {
    render(<PromptEditor {...defaultProps} promptId="prompt-summarize" prompt={MOCK_PROMPTS[0]} />);
    expect(screen.getByText(/Created/)).toBeDefined();
    expect(screen.getByText(/Updated/)).toBeDefined();
    expect(screen.getByText(/Last used/)).toBeDefined();
  });

  describe('edit-mode action buttons', () => {
    it('calls onDuplicate when Duplicate button is clicked', () => {
      const onDuplicate = vi.fn();
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
          onDuplicate={onDuplicate}
        />,
      );
      fireEvent.click(screen.getByText('Duplicate'));
      expect(onDuplicate).toHaveBeenCalledTimes(1);
    });

    it('calls onArchive when Archive button is clicked', () => {
      const onArchive = vi.fn();
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
          onArchive={onArchive}
        />,
      );
      fireEvent.click(screen.getByText('Archive'));
      expect(onArchive).toHaveBeenCalledTimes(1);
    });

    it('calls onCopy with the current body when Copy prompt is clicked', () => {
      const onCopy = vi.fn();
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
          onCopy={onCopy}
        />,
      );
      fireEvent.change(screen.getByLabelText('Body'), {
        target: { value: 'Draft body in progress' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }));
      expect(onCopy).toHaveBeenCalledWith('Draft body in progress');
    });

    it('hides unavailable actions when callbacks are not provided', () => {
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
        />,
      );
      expect(screen.queryByText('Duplicate')).toBeNull();
      expect(screen.queryByText('Archive')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Copy prompt' })).toBeNull();
    });
  });
});
