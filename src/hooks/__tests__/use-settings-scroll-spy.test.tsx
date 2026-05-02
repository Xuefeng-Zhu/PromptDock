// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSettingsScrollSpy } from '../use-settings-scroll-spy';

type SectionId = 'account-sync' | 'appearance' | 'about';

const ITEMS: Array<{ id: SectionId }> = [
  { id: 'account-sync' },
  { id: 'appearance' },
  { id: 'about' },
];

function rectWithTop(top: number): DOMRect {
  return {
    bottom: top + 100,
    height: 100,
    left: 0,
    right: 100,
    top,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

function ScrollSpyHarness() {
  const spy = useSettingsScrollSpy(ITEMS, 'account-sync', 72);

  return (
    <div>
      <output data-testid="active">{spy.activeSection}</output>
      <button type="button" onClick={() => spy.scrollToSection('about')}>
        Jump to about
      </button>
      <div ref={spy.contentScrollRef} data-testid="scroll-pane">
        {ITEMS.map((item) => (
          <section
            key={item.id}
            ref={spy.setSectionRef(item.id)}
            data-testid={`section-${item.id}`}
          >
            {item.id}
          </section>
        ))}
      </div>
    </div>
  );
}

function setRect(element: Element, top: number) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => rectWithTop(top),
  });
}

describe('useSettingsScrollSpy', () => {
  it('activates the last section above the configured offset on scroll', () => {
    render(<ScrollSpyHarness />);

    const pane = screen.getByTestId('scroll-pane');
    setRect(pane, 100);
    setRect(screen.getByTestId('section-account-sync'), 100);
    setRect(screen.getByTestId('section-appearance'), 150);
    setRect(screen.getByTestId('section-about'), 190);

    fireEvent.scroll(pane);

    expect(screen.getByTestId('active').textContent).toBe('appearance');
  });

  it('sets active section and scrolls to the requested target', () => {
    render(<ScrollSpyHarness />);

    const pane = screen.getByTestId('scroll-pane') as HTMLDivElement;
    pane.scrollTop = 20;
    pane.scrollTo = vi.fn(({ top }) => {
      pane.scrollTop = Number(top);
    });
    setRect(pane, 100);
    setRect(screen.getByTestId('section-about'), 260);

    fireEvent.click(screen.getByRole('button', { name: 'Jump to about' }));

    expect(screen.getByTestId('active').textContent).toBe('about');
    expect(pane.scrollTo).toHaveBeenCalledWith({ top: 180, behavior: 'smooth' });
    expect(pane.scrollTop).toBe(180);
  });
});
