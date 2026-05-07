// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewVariableInput } from '../PreviewVariableInput';

describe('PreviewVariableInput', () => {
  it('formats the label and calls onChange with the new value', () => {
    const onChange = vi.fn();

    render(<PreviewVariableInput variableName="audience" value="" onChange={onChange} />);

    expect(screen.getByText('Audience')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Preview value for audience'), {
      target: { value: 'Developers' },
    });

    expect(onChange).toHaveBeenCalledWith('audience', 'Developers');
  });


  it('does not render clear button when value is empty', () => {
    const onChange = vi.fn();

    render(<PreviewVariableInput variableName="topic" value="" onChange={onChange} />);

    expect(screen.queryByLabelText('Clear topic')).toBeNull();
  });

  it('clears the value when clear is clicked', () => {
    const onChange = vi.fn();

    render(<PreviewVariableInput variableName="format" value="bullet points" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Clear format'));

    expect(onChange).toHaveBeenCalledWith('format', '');
  });
});
