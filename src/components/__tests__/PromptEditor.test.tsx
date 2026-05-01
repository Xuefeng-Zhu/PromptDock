// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptEditor } from '../PromptEditor';
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

  it('renders the Insert variable button', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Insert variable')).toBeDefined();
  });

  it('opens formatting help when Formatting help is clicked', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.queryByText('Template formatting')).toBeNull();
    fireEvent.click(screen.getByText('Formatting help'));
    expect(screen.getByText('Template formatting')).toBeDefined();
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

  it('shows Duplicate, Archive, Copy buttons when editing', () => {
    render(<PromptEditor {...defaultProps} promptId="prompt-summarize" prompt={MOCK_PROMPTS[0]} />);
    expect(screen.getByText('Duplicate')).toBeDefined();
    expect(screen.getByText('Archive')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
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

    it('calls onCopy when Copy button is clicked', () => {
      const onCopy = vi.fn();
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
          onCopy={onCopy}
        />,
      );
      fireEvent.click(screen.getByText('Copy'));
      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('does not throw when action buttons are clicked without callbacks', () => {
      render(
        <PromptEditor
          {...defaultProps}
          promptId="prompt-summarize"
          prompt={MOCK_PROMPTS[0]}
        />,
      );
      expect(() => fireEvent.click(screen.getByText('Duplicate'))).not.toThrow();
      expect(() => fireEvent.click(screen.getByText('Archive'))).not.toThrow();
      expect(() => fireEvent.click(screen.getByText('Copy'))).not.toThrow();
    });
  });
});
