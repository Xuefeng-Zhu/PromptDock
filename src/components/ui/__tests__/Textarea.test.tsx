// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Write here" />);
    expect(screen.getByPlaceholderText('Write here')).toBeDefined();
  });

  it('renders a label associated with the textarea', () => {
    render(<Textarea label="Body" />);
    const label = screen.getByText('Body');
    const textarea = screen.getByRole('textbox');

    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe(textarea.id);
  });

  it('shows error message with role alert', () => {
    render(<Textarea label="Body" error="Body is required" />);

    expect(screen.getByRole('alert').textContent).toBe('Body is required');
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('handles change events', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies shared field styling', () => {
    render(<Textarea error="Bad" className="min-h-24" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea.className).toContain('border-red-500');
    expect(textarea.className).toContain('focus-visible:outline-2');
    expect(textarea.className).toContain('min-h-24');
  });
});
