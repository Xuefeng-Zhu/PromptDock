import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterPrompts } from '../AppShell';
import type { PromptRecipe } from '../../types/index';

/**
 * Feature: prompt-dock-ui
 * Property 3: Favorites filter returns only favorited prompts
 *
 * For any list of PromptRecipe objects, the favorites filter returns exactly
 * the subset where favorite === true.
 *
 * **Validates: Requirements 5.5**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

const nonArchivedPromptArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.string({ minLength: 1, maxLength: 10 }),
  title: fc.string({ maxLength: 50 }),
  description: fc.string({ maxLength: 100 }),
  body: fc.string({ maxLength: 200 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 5 }),
  folderId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.constant(false),
  archivedAt: fc.constant(null),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  lastUsedAt: fc.option(fc.date(), { nil: null }),
  createdBy: fc.string({ minLength: 1, maxLength: 10 }),
  version: fc.nat({ max: 100 }),
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 3: Favorites filter returns only favorited prompts', () => {
  it('returns exactly the subset where favorite === true', () => {
    fc.assert(
      fc.property(
        fc.array(nonArchivedPromptArb, { minLength: 0, maxLength: 15 }),
        (prompts) => {
          const results = filterPrompts(prompts, '', 'favorites', 'library');

          // Every result has favorite === true
          for (const result of results) {
            expect(result.favorite).toBe(true);
          }

          // Length is <= original
          expect(results.length).toBeLessThanOrEqual(prompts.length);

          // No favorited non-archived prompt is excluded
          const resultIds = new Set(results.map((r) => r.id));
          for (const prompt of prompts) {
            if (!prompt.archived && prompt.favorite) {
              expect(resultIds.has(prompt.id)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
