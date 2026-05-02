import { describe, expect, it } from 'vitest';
import { clampIndex } from '../list-navigation';

describe('clampIndex', () => {
  it('returns zero for empty lists', () => {
    expect(clampIndex(4, 1, 0)).toBe(0);
    expect(clampIndex(4, 1, -2)).toBe(0);
  });

  it('moves within list bounds', () => {
    expect(clampIndex(1, 1, 4)).toBe(2);
    expect(clampIndex(2, -1, 4)).toBe(1);
  });

  it('clamps underflow and overflow', () => {
    expect(clampIndex(0, -1, 4)).toBe(0);
    expect(clampIndex(3, 1, 4)).toBe(3);
  });
});
