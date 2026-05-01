// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyTheme } from '../theme';

describe('applyTheme', () => {
  beforeEach(() => {
    // Reset classes on the root element before each test
    document.documentElement.classList.remove('dark', 'light');
  });

  // ── Light mode ───────────────────────────────────────────────────────────────

  it('adds "light" and removes "dark" when theme is "light"', () => {
    document.documentElement.classList.add('dark');

    applyTheme('light');

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('is idempotent for "light" when already in light mode', () => {
    document.documentElement.classList.add('light');

    applyTheme('light');

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  // ── Dark mode ────────────────────────────────────────────────────────────────

  it('adds "dark" and removes "light" when theme is "dark"', () => {
    document.documentElement.classList.add('light');

    applyTheme('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('is idempotent for "dark" when already in dark mode', () => {
    document.documentElement.classList.add('dark');

    applyTheme('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  // ── System mode ──────────────────────────────────────────────────────────────

  it('applies "dark" when system prefers dark', () => {
    // Mock matchMedia to report dark preference
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    vi.restoreAllMocks();
  });

  it('applies "light" when system prefers light', () => {
    // Mock matchMedia to report light preference
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);

    vi.restoreAllMocks();
  });

  it('removes both classes before applying system preference', () => {
    document.documentElement.classList.add('dark', 'light');

    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });

    applyTheme('system');

    // Only "light" should remain (system prefers light)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);

    vi.restoreAllMocks();
  });

  // ── Transition between modes ─────────────────────────────────────────────────

  it('transitions correctly from dark to light', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyTheme('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('transitions correctly from light to system (dark preference)', () => {
    applyTheme('light');

    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    });

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    vi.restoreAllMocks();
  });
});
