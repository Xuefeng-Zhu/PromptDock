// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders with role="switch"', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByRole('switch')).toBeDefined();
  });

  it('renders the label text', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Enable sync" />);
    expect(screen.getByText('Enable sync')).toBeDefined();
  });

  it('has aria-checked="false" when unchecked', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('has aria-checked="true" when checked', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onChange with toggled value on click', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} label="Toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when currently checked', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={true} onChange={handleChange} label="Toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('respects disabled state', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} label="Toggle" disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveProperty('disabled', true);
    expect(toggle.className).toContain('disabled:opacity-50');
    fireEvent.click(toggle);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies primary color when checked', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('bg-[var(--color-primary)]');
  });

  it('applies gray color when unchecked', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('bg-gray-300');
  });

  it('has focus ring styles', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('focus-visible:outline-2');
    expect(toggle.className).toContain('focus-visible:outline-[var(--color-primary)]');
  });
});
