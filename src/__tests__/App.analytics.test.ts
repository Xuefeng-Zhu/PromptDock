import { describe, expect, it } from 'vitest';
import { shouldTrackAppOpen } from '../App';

describe('App Analytics initialization', () => {
  it('tracks app-open only for the main surface', () => {
    expect(shouldTrackAppOpen(true, 'main')).toBe(true);
    expect(shouldTrackAppOpen(true, 'quick_launcher')).toBe(false);
    expect(shouldTrackAppOpen(false, 'main')).toBe(false);
  });
});
