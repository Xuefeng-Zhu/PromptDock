import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { countWords, countChars } from '../PromptEditor';

/**
 * Feature: prompt-dock-ui
 * Property 5: Word count and character count correctness
 *
 * For any string, character count equals .length; word count equals
 * non-empty tokens from whitespace split; empty string yields zero for both.
 *
 * **Validates: Requirements 6.4**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Arbitrary non-empty string with various whitespace patterns */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 200 });

/** Arbitrary string that may be empty */
const anyStringArb = fc.string({ maxLength: 200 });

/** Strings with explicit whitespace patterns (spaces, tabs, newlines) */
const whitespaceHeavyStringArb = fc.array(
  fc.oneof(
    fc.stringMatching(/^\S{1,15}$/),
    fc.constantFrom(' ', '  ', '\t', '\n', '\r\n', '   '),
  ),
  { minLength: 0, maxLength: 20 },
).map((parts) => parts.join(''));

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 5: Word count and character count correctness', () => {
  it('character count equals string .length for any string', () => {
    fc.assert(
      fc.property(anyStringArb, (text) => {
        expect(countChars(text)).toBe(text.length);
      }),
      { numRuns: 100 },
    );
  });

  it('word count equals non-empty tokens from whitespace split for any string', () => {
    fc.assert(
      fc.property(anyStringArb, (text) => {
        const expected = text.split(/\s+/).filter((t) => t.length > 0).length;
        expect(countWords(text)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('empty string yields zero for both counts', () => {
    expect(countChars('')).toBe(0);
    expect(countWords('')).toBe(0);
  });

  it('word count handles strings with varied whitespace patterns', () => {
    fc.assert(
      fc.property(whitespaceHeavyStringArb, (text) => {
        const expected = text.split(/\s+/).filter((t) => t.length > 0).length;
        expect(countWords(text)).toBe(expected);
        expect(countChars(text)).toBe(text.length);
      }),
      { numRuns: 100 },
    );
  });
});
