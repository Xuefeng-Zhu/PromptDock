import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatRelativeShort, formatRelativeTime } from '../date-format';

describe('date-format utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats nullable absolute dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(new Date(2024, 0, 5))).toBe('Jan 5, 2024');
  });

  it('formats short relative dates for recent usage', () => {
    expect(formatRelativeShort(null)).toBe('—');
    expect(formatRelativeShort(new Date(2024, 0, 15, 11, 45))).toBe('just now');
    expect(formatRelativeShort(new Date(2024, 0, 15, 9, 0))).toBe('3h ago');
    expect(formatRelativeShort(new Date(2024, 0, 13, 12, 0))).toBe('2d ago');
    expect(formatRelativeShort(new Date(2024, 0, 1, 12, 0))).toBe('Jan 1, 2024');
  });

  it('formats long relative dates with singular and plural units', () => {
    expect(formatRelativeTime(null)).toBe('Never used');
    expect(formatRelativeTime(new Date(2024, 0, 15, 11, 59, 30))).toBe('just now');
    expect(formatRelativeTime(new Date(2024, 0, 15, 11, 59))).toBe('1 minute ago');
    expect(formatRelativeTime(new Date(2024, 0, 15, 10, 0))).toBe('2 hours ago');
    expect(formatRelativeTime(new Date(2024, 0, 12, 12, 0))).toBe('3 days ago');
    expect(formatRelativeTime(new Date(2023, 11, 25, 12, 0))).toBe('3 weeks ago');
    expect(formatRelativeTime(new Date(2023, 7, 15, 12, 0))).toBe('5 months ago');
    expect(formatRelativeTime(new Date(2022, 0, 15, 12, 0))).toBe('2 years ago');
  });
});
