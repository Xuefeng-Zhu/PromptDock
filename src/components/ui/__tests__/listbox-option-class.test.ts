import { describe, expect, it } from 'vitest';
import { getListboxOptionClass } from '../listbox/listbox-option-class';

describe('getListboxOptionClass', () => {
  it('uses the shared active option state classes', () => {
    const className = getListboxOptionClass({ active: true });

    expect(className).toContain('flex w-full items-center gap-2');
    expect(className).toContain('px-2 py-2 text-sm');
    expect(className).toContain('bg-[var(--color-primary-light)]');
    expect(className).toContain('text-[var(--color-primary)]');
  });

  it('supports compact block options', () => {
    const className = getListboxOptionClass({
      active: false,
      className: 'custom-class',
      layout: 'block',
      size: 'compact',
    });

    expect(className).toContain('block w-full');
    expect(className).toContain('px-2 py-1.5 text-xs');
    expect(className).toContain('text-[var(--color-text-main)] hover:bg-gray-50');
    expect(className).toContain('custom-class');
  });
});
