// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VariableFillModal } from '../variable-fill';
import { MOCK_PROMPTS } from '../../data/mock-data';
import { resolvePromptVariables } from '../../utils/prompt-variables';

// Use MOCK_PROMPTS[0] — "Summarize Text" with variables: audience, text, format
const testPrompt = MOCK_PROMPTS[0];
const testVariables = resolvePromptVariables(testPrompt.body);

const defaultProps = {
  prompt: testPrompt,
  variables: testVariables,
  onCancel: vi.fn(),
  defaultAction: 'copy' as const,
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
    for (const { name: varName } of testVariables) {
      const input = screen.getByLabelText(`Value for variable ${varName}`);
      expect(input).toBeDefined();
    }
  });

  it('renders placeholder text for each variable input', () => {
    render(<VariableFillModal {...defaultProps} />);
    for (const { name: varName } of testVariables) {
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

  it('renders configured textarea and dropdown controls', () => {
    const typedVariables = resolvePromptVariables(testPrompt.body, [
      {
        name: 'audience',
        defaultValue: '',
        description: 'Choose the audience',
        inputType: 'dropdown',
        options: ['developers', 'managers'],
      },
      {
        name: 'text',
        defaultValue: '',
        description: 'Long source material',
        inputType: 'textarea',
        options: [],
      },
      {
        name: 'format',
        defaultValue: 'markdown',
        description: '',
        inputType: 'text',
        options: [],
      },
    ]);

    render(
      <VariableFillModal
        {...defaultProps}
        prompt={{ ...testPrompt, variables: typedVariables }}
        variables={typedVariables}
      />,
    );

    const audienceSelect = screen.getByRole('combobox', {
      name: 'Value for variable audience',
    });
    const textInput = screen.getByLabelText('Value for variable text');
    const formatInput = screen.getByLabelText('Value for variable format');

    expect(audienceSelect).toBeDefined();
    expect(textInput.tagName).toBe('TEXTAREA');
    expect((formatInput as HTMLInputElement).value).toBe('markdown');
  });

  it('disables Copy button when variables are not all filled', () => {
    render(<VariableFillModal {...defaultProps} />);
    const copyButton = screen.getByRole('button', {
      name: /Copy to Clipboard/i,
    });
    expect(copyButton.hasAttribute('disabled')).toBe(true);
  });

  it('does not render a Paste button', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /Paste/i })).toBeNull();
  });

  it('defaults the primary action to Paste into Active App', () => {
    const { defaultAction, ...propsWithoutAction } = defaultProps;
    expect(defaultAction).toBe('copy');
    render(<VariableFillModal {...propsWithoutAction} />);

    expect(
      screen.getByRole('button', { name: /Paste into Active App/i }),
    ).toBeDefined();
  });

  it('enables Copy button when all variables are filled', () => {
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
      name: /Copy to Clipboard/i,
    });
    expect(copyButton.hasAttribute('disabled')).toBe(false);
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
      name: /Copy to Clipboard/i,
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

  it('uses Paste into Active App as the primary action when configured', async () => {
    const onCopy = vi.fn();
    const onPaste = vi.fn();
    render(
      <VariableFillModal
        {...defaultProps}
        defaultAction="paste"
        onCopy={onCopy}
        onPaste={onPaste}
      />,
    );

    fireEvent.change(screen.getByLabelText('Value for variable audience'), {
      target: { value: 'managers' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable text'), {
      target: { value: 'Report content' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable format'), {
      target: { value: 'paragraphs' },
    });

    const primaryButton = screen.getByRole('button', {
      name: /Paste into Active App/i,
    });
    await act(async () => {
      fireEvent.click(primaryButton);
    });

    expect(onPaste).toHaveBeenCalledTimes(1);
    expect(onCopy).not.toHaveBeenCalled();
    const renderedText = onPaste.mock.calls[0][0] as string;
    expect(renderedText).toContain('managers');
    expect(renderedText).toContain('Report content');
    expect(renderedText).toContain('paragraphs');
  });

  it('uses the keyboard shortcut for the configured primary action', async () => {
    const onPaste = vi.fn();
    render(
      <VariableFillModal
        {...defaultProps}
        defaultAction="paste"
        onPaste={onPaste}
      />,
    );

    fireEvent.change(screen.getByLabelText('Value for variable audience'), {
      target: { value: 'developers' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable text'), {
      target: { value: 'Hello world' },
    });
    fireEvent.change(screen.getByLabelText('Value for variable format'), {
      target: { value: 'markdown' },
    });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    });

    expect(onPaste).toHaveBeenCalledTimes(1);
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
        name: /Copy to Clipboard/i,
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

      // Should revert back to "Copy to Clipboard"
      expect(screen.queryByText('Copied!')).toBeNull();
      expect(
        screen.getByRole('button', { name: /Copy to Clipboard/i }),
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
        name: /Copy to Clipboard/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(screen.queryByText('Copied!')).toBeNull();
      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });

  it('does not render the paste-anywhere hint text', () => {
    render(<VariableFillModal {...defaultProps} />);
    expect(
      screen.queryByText('Built for speed. Use ⌘V to paste anywhere.'),
    ).toBeNull();
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
    expect(screen.getByText('⌘↵')).toBeDefined();
  });
});
