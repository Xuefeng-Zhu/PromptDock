// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LivePreviewVariableControl } from '../prompt-editor/LivePreviewVariableControl';
import type { PromptVariable } from '../../types/index';

function makeVariable(overrides: Partial<PromptVariable> = {}): PromptVariable {
  return {
    name: 'tone',
    defaultValue: '',
    description: '',
    inputType: 'text',
    options: [],
    ...overrides,
  };
}

describe('LivePreviewVariableControl', () => {
  it('renders a text input and reports changes', () => {
    const onValueChange = vi.fn();
    render(
      <LivePreviewVariableControl
        variable={makeVariable()}
        value=""
        onValueChange={onValueChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Preview value for tone'), {
      target: { value: 'Friendly' },
    });

    expect(onValueChange).toHaveBeenCalledWith('tone', 'Friendly');
  });

  it('renders textarea and dropdown variants', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <LivePreviewVariableControl
        variable={makeVariable({ inputType: 'textarea', name: 'context' })}
        value=""
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByLabelText('Preview value for context').tagName).toBe('TEXTAREA');

    rerender(
      <LivePreviewVariableControl
        variable={makeVariable({
          inputType: 'dropdown',
          options: ['Friendly', 'Professional'],
        })}
        value="Friendly"
        onValueChange={onValueChange}
      />,
    );

    const dropdown = screen.getByRole('combobox', {
      name: 'Preview value for tone',
    });
    expect(dropdown).toBeDefined();
    expect(screen.getByRole('option', { name: 'Professional' })).toBeDefined();
  });

  it('clears the current value', () => {
    const onValueChange = vi.fn();
    render(
      <LivePreviewVariableControl
        variable={makeVariable()}
        value="Friendly"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear tone' }));

    expect(onValueChange).toHaveBeenCalledWith('tone', '');
  });
});
