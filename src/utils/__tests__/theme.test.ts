// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyTheme } from '../theme';

function mockSystemColorScheme(matchesDark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: matchesDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList));
}

describe('applyTheme', () => {
  beforeEach(() => {
    // Reset classes on the root element before each test
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    mockSystemColorScheme(true);

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies "light" when system prefers light', () => {
    mockSystemColorScheme(false);

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('removes both classes before applying system preference', () => {
    document.documentElement.classList.add('dark', 'light');

    mockSystemColorScheme(false);

    applyTheme('system');

    // Only "light" should remain (system prefers light)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
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

    mockSystemColorScheme(true);

    applyTheme('system');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
