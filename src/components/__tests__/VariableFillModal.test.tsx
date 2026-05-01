// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VariableFillModal } from '../VariableFillModal';
import { MOCK_PROMPTS } from '../../data/mock-data';

// Use MOCK_PROMPTS[0] — "Summarize Text" with variables: audience, text, format
const testPrompt = MOCK_PROMPTS[0];
const testVariables = ['audience', 'text', 'format'];

const defaultProps = {
  prompt: testPrompt,
  variables: testVariables,
  onCancel: vi.fn(),
  onCopy: vi.fn(),
  onPaste: vi.fn(),
};

describe('VariableFillModal', () => {
  it('renders the prompt title in the header', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(screen.getByText('Summarize Text')).toBeDefined();
  });

  it('renders input fields for each variable', () => {
    render(<VariableFillModal {...defaultProps} />);
    for (const varName of testVariables) {
      const input = screen.getByLabelText(`Value for variable ${varName}`);
      expect(input).toBeDefined();
    }
  });

  it('renders placeholder text for each variable input', () => {
    render(<VariableFillModal {...defaultProps} />);
    for (const varName of testVariables) {
      expect(
        screen.getByPlaceholderText(`Enter value for ${varName}`),
      ).toBeDefined();
    }
  });

  it('shows live preview of the prompt body', () => {
    render(<VariableFillModal {...defaultProps} />);
    const preview = screen.getByLabelText('Rendered prompt preview');
    expect(preview).toBeDefined();
    // Preview should contain the template with unfilled variables
    expect(preview.textContent).toContain('{{audience}}');
    expect(preview.textContent).toContain('{{text}}');
    expect(preview.textContent).toContain('{{format}}');
  });

  it('updates preview when variable values are filled', () => {
    render(<VariableFillModal {...defaultProps} />);
    const audienceInput = screen.getByLabelText(
      'Value for variable audience',
    );
    fireEvent.change(audienceInput, { target: { value: 'developers' } });
    const preview = screen.getByLabelText('Rendered prompt preview');
    expect(preview.textContent).toContain('developers');
    expect(preview.textContent).not.toContain('{{audience}}');
  });

  it('disables Copy button when variables are not all filled', () => {
    render(<VariableFillModal {...defaultProps} />);
    const copyButton = screen.getByRole('button', {
      name: /Copy final prompt/i,
    });
    expect(copyButton.hasAttribute('disabled')).toBe(true);
  });

  it('disables Paste button when variables are not all filled', () => {
    render(<VariableFillModal {...defaultProps} />);
    const pasteButton = screen.getByRole('button', { name: /Paste/i });
    expect(pasteButton.hasAttribute('disabled')).toBe(true);
  });

  it('enables Copy and Paste buttons when all variables are filled', () => {
    render(<VariableFillModal {...defaultProps} />);
    // Fill all variables
    fireEvent.change(screen.getByLabelText('Value for variable audience'), {
      target: { value: 'developers' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable text'), {
      target: { value: 'Some long text here' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable format'), {
      target: { value: 'bullet points' },
    });

    const copyButton = screen.getByRole('button', {
      name: /Copy final prompt/i,
    });
    const pasteButton = screen.getByRole('button', { name: /Paste/i });
    expect(copyButton.hasAttribute('disabled')).toBe(false);
    expect(pasteButton.hasAttribute('disabled')).toBe(false);
  });

  it('calls onCopy with rendered text when Copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(<VariableFillModal {...defaultProps} onCopy={onCopy} />);
    // Fill all variables
    fireEvent.change(screen.getByLabelText('Value for variable audience'), {
      target: { value: 'developers' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable text'), {
      target: { value: 'Hello world' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable format'), {
      target: { value: 'markdown' },
    });

    const copyButton = screen.getByRole('button', {
      name: /Copy final prompt/i,
    });
    await act(async () => {
      fireEvent.click(copyButton);
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
    const renderedText = onCopy.mock.calls[0][0] as string;
    expect(renderedText).toContain('developers');
    expect(renderedText).toContain('Hello world');
    expect(renderedText).toContain('markdown');
  });

  it('calls onPaste with rendered text when Paste button is clicked', () => {
    const onPaste = vi.fn();
    render(<VariableFillModal {...defaultProps} onPaste={onPaste} />);
    // Fill all variables
    fireEvent.change(screen.getByLabelText('Value for variable audience'), {
      target: { value: 'managers' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable text'), {
      target: { value: 'Report content' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable format'), {
      target: { value: 'paragraphs' },
    });

    const pasteButton = screen.getByRole('button', { name: /Paste/i });
    fireEvent.click(pasteButton);
    expect(onPaste).toHaveBeenCalledTimes(1);
    const renderedText = onPaste.mock.calls[0][0] as string;
    expect(renderedText).toContain('managers');
  });

  describe('Copied! success state', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows "Copied!" success state after copy and reverts after 2 seconds', async () => {
      render(<VariableFillModal {...defaultProps} />);
      // Fill all variables
      fireEvent.change(screen.getByLabelText('Value for variable audience'), {
        target: { value: 'devs' },
      });
      fireEvent.change(screen.getByLabelText('Value for variable text'), {
        target: { value: 'content' },
      });
      fireEvent.change(screen.getByLabelText('Value for variable format'), {
        target: { value: 'list' },
      });

      const copyButton = screen.getByRole('button', {
        name: /Copy final prompt/i,
      });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Should now show "Copied!" text
      expect(screen.getByText('Copied!')).toBeDefined();

      // Advance timers by 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should revert back to "Copy final prompt"
      expect(screen.queryByText('Copied!')).toBeNull();
      expect(
        screen.getByRole('button', { name: /Copy final prompt/i }),
      ).toBeDefined();
    });

    it('does not show "Copied!" when copy fails', async () => {
      const onCopy = vi.fn(async () => {
        throw new Error('copy failed');
      });

      render(<VariableFillModal {...defaultProps} onCopy={onCopy} />);

      fireEvent.change(screen.getByLabelText('Value for variable audience'), {
        target: { value: 'devs' },
      });
      fireEvent.change(screen.getByLabelText('Value for variable text'), {
        target: { value: 'content' },
      });
      fireEvent.change(screen.getByLabelText('Value for variable format'), {
        target: { value: 'list' },
      });

      const copyButton = screen.getByRole('button', {
        name: /Copy final prompt/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(screen.queryByText('Copied!')).toBeNull();
      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the floating hint text', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(
      screen.getByText('Built for speed. Use ⌘V to paste anywhere.'),
    ).toBeDefined();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<VariableFillModal {...defaultProps} onCancel={onCancel} />);
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking the backdrop', () => {
    const onCancel = vi.fn();
    render(<VariableFillModal {...defaultProps} onCancel={onCancel} />);
    const backdrop = screen.getByTestId('variable-fill-backdrop');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders dialog with correct ARIA attributes', () => {
    render(<VariableFillModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(
      'Fill variables for Summarize Text',
    );
  });

  it('renders the "Preview" heading', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('renders keyboard shortcut hints on buttons', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(screen.getByText('Esc')).toBeDefined();
    expect(screen.getByText('⌘V')).toBeDefined();
  });
});
