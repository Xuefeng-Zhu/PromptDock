// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders Formatting help link', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Formatting help')).toBeDefined();
  });

  it('renders action buttons including Save', () => {
    render(<PromptEditor {...defaultProps} />);
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
});
