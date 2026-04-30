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
    expect(screen.getByText('New Prompt')).toBeDefined();
  });

  it('shows "Edit Prompt" breadcrumb when editing an existing prompt', () => {
    render(<PromptEditor {...defaultProps} promptId="prompt-summarize" prompt={MOCK_PROMPTS[0]} />);
    expect(screen.getByText('Edit Prompt')).toBeDefined();
  });

  it('updates word and character counts when body changes', () => {
    render(<PromptEditor {...defaultProps} />);
    const bodyTextarea = screen.getByLabelText('Body');
    fireEvent.change(bodyTextarea, { target: { value: 'hello world' } });
    // 2 words, 11 chars
    expect(screen.getByText(/2 words/)).toBeDefined();
    expect(screen.getByText(/11 chars/)).toBeDefined();
  });

  it('renders the Live Preview panel', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Live Preview')).toBeDefined();
  });

  it('renders the Tips card', () => {
    render(<PromptEditor {...defaultProps} />);
    expect(screen.getByText('Tips')).toBeDefined();
  });
});
