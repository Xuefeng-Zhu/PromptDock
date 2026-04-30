// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeDefined();
  });

  it('renders nested children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeDefined();
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('applies default md padding', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('p-5');
  });

  it('applies sm padding variant', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('p-3');
  });

  it('applies lg padding variant', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('p-7');
  });

  it('has rounded corners', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('rounded-xl');
  });

  it('has border and shadow', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('border');
    expect(card.className).toContain('shadow-sm');
  });

  it('uses panel background color', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('bg-[var(--color-panel)]');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="mt-4 w-full">Content</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('mt-4');
    expect(card.className).toContain('w-full');
  });
});
