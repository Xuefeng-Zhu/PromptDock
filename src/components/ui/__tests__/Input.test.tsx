// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeDefined();
  });

  it('renders a label associated with the input', () => {
    render(<Input label="Email" />);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    // The label's htmlFor should match the input's id
    const input = screen.getByRole('textbox');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('shows error message with role="alert"', () => {
    render(<Input label="Name" error="Name is required" />);
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('Name is required');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows hint text when no error', () => {
    render(<Input hint="Enter your full name" />);
    expect(screen.getByText('Enter your full name')).toBeDefined();
  });

  it('hides hint text when error is present', () => {
    render(<Input hint="Enter your full name" error="Required" />);
    expect(screen.queryByText('Enter your full name')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('Required');
  });

  it('handles change events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies error border styling when error is present', () => {
    render(<Input error="Bad" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  it('applies normal border styling when no error', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-[var(--color-border)]');
  });

  it('has focus ring styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('focus-visible:outline-2');
    expect(input.className).toContain('focus-visible:outline-[var(--color-primary)]');
  });

  it('sets aria-describedby linking to error and hint', () => {
    render(<Input id="test-input" error="Error msg" />);
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('test-input-error');
  });
});
