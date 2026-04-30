// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IconTile } from '../IconTile';

describe('IconTile', () => {
  it('renders the provided icon', () => {
    render(<IconTile icon={<span data-testid="icon">★</span>} color="bg-purple-100" />);
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('applies the color class to the container', () => {
    const { container } = render(
      <IconTile icon={<span>★</span>} color="bg-purple-100" />
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain('bg-purple-100');
  });

  it('renders with rounded-lg styling', () => {
    const { container } = render(
      <IconTile icon={<span>★</span>} color="bg-green-100" />
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain('rounded-lg');
  });

  it('centers the icon within the tile', () => {
    const { container } = render(
      <IconTile icon={<span>★</span>} color="bg-blue-100" />
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain('items-center');
    expect(tile.className).toContain('justify-center');
  });

  it('has a fixed 9x9 size', () => {
    const { container } = render(
      <IconTile icon={<span>★</span>} color="bg-amber-100" />
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.className).toContain('h-9');
    expect(tile.className).toContain('w-9');
  });
});
