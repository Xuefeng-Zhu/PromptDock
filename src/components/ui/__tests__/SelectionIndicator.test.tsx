// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SelectionIndicator } from '../SelectionIndicator';

describe('SelectionIndicator', () => {
  it('renders a selected checkbox indicator', () => {
    const { container } = render(<SelectionIndicator selected />);

    const indicator = container.firstElementChild;
    expect(indicator?.className).toContain('rounded');
    expect(indicator?.className).toContain('bg-[var(--color-primary)]');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a selected radio indicator', () => {
    const { container } = render(<SelectionIndicator selected type="radio" />);

    const indicator = container.firstElementChild;
    expect(indicator?.className).toContain('rounded-full');
    expect(container.querySelector('svg')).toBeNull();
    expect(indicator?.querySelector('span')?.className).toContain('bg-white');
  });
});
