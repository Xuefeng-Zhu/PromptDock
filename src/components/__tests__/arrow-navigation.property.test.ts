import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { clampIndex } from '../CommandPalette';

/**
 * Feature: prompt-dock-ui
 * Property 7: Arrow key navigation stays within bounds
 *
 * For any list of N results (N ≥ 1) and any sequence of ↑/↓ presses,
 * highlighted index stays in [0, N-1]. Pressing ↓ when at index N-1
 * should not increase the index, and pressing ↑ when at index 0 should
 * not decrease it.
 *
 * **Validates: Requirements 10.3**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** List length N ≥ 1 */
const listLengthArb = fc.integer({ min: 1, max: 200 });

/** A sequence of arrow key deltas: -1 (↑) or +1 (↓) */
const deltaSequenceArb = fc.array(fc.constantFrom(-1, 1), { minLength: 1, maxLength: 50 });

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 7: Arrow key navigation stays within bounds', () => {
  it('highlighted index stays in [0, N-1] for any sequence of ↑/↓ presses', () => {
    fc.assert(
      fc.property(listLengthArb, deltaSequenceArb, (listLength, deltas) => {
        let index = 0;

        for (const delta of deltas) {
          index = clampIndex(index, delta, listLength);

          // Index must always be within bounds
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(listLength);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('pressing ↓ at N-1 does not increase the index', () => {
    fc.assert(
      fc.property(listLengthArb, (listLength) => {
        const result = clampIndex(listLength - 1, 1, listLength);
        expect(result).toBe(listLength - 1);
      }),
      { numRuns: 100 },
    );
  });

  it('pressing ↑ at 0 does not decrease the index', () => {
    fc.assert(
      fc.property(listLengthArb, (listLength) => {
        const result = clampIndex(0, -1, listLength);
        expect(result).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
