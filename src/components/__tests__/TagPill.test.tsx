// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagPill } from '../ui';

describe('TagPill', () => {
  it('renders the tag name', () => {
    render(<TagPill tag="writing" />);
    expect(screen.getByText('writing')).toBeDefined();
  });

  it('does not render a remove button when onRemove is not provided', () => {
    render(<TagPill tag="code" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a remove button when onRemove is provided', () => {
    render(<TagPill tag="code" onRemove={() => {}} />);
    const btn = screen.getByRole('button', { name: /remove code tag/i });
    expect(btn).toBeDefined();
  });

  it('calls onRemove when the remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(<TagPill tag="draft" onRemove={handleRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /remove draft tag/i }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('applies rounded-full pill styling', () => {
    const { container } = render(<TagPill tag="test" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('rounded-full');
  });
});
