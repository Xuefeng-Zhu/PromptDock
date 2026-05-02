import { describe, expect, it } from 'vitest';
import { countChars, countWords } from '../text-counts';

describe('text-counts utilities', () => {
  it('counts words across repeated whitespace', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  one\t two\nthree  ')).toBe(3);
  });

  it('counts JavaScript string characters', () => {
    expect(countChars('PromptDock')).toBe(10);
    expect(countChars('line\nbreak')).toBe(10);
  });
});
