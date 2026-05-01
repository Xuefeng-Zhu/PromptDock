import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterPrompts } from '../AppShell';
import type { PromptRecipe } from '../../types/index';

/**
 * Feature: prompt-dock-ui
 * Property 2: Search filtering returns only matching prompts
 *
 * For any non-empty search query and any list of PromptRecipe objects, every
 * returned prompt contains the query as a case-insensitive substring in title,
 * description, or tags; no matching non-archived prompt is excluded.
 *
 * **Validates: Requirements 5.4, 7.4, 12.5**
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

const searchQueryArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0);

// ─── Helper ────────────────────────────────────────────────────────────────────

function matchesQuery(prompt: PromptRecipe, query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    prompt.title.toLowerCase().includes(q) ||
    prompt.description.toLowerCase().includes(q) ||
    prompt.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 2: Search filtering returns only matching prompts', () => {
  it('every returned prompt matches the query in title, description, or tags', () => {
    fc.assert(
      fc.property(
        searchQueryArb,
        fc.array(nonArchivedPromptArb, { minLength: 0, maxLength: 10 }),
        (query, prompts) => {
          const results = filterPrompts(prompts, query, 'all', 'library');

          for (const result of results) {
            expect(matchesQuery(result, query)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no matching non-archived prompt is excluded from results', () => {
    fc.assert(
      fc.property(
        searchQueryArb,
        fc.array(nonArchivedPromptArb, { minLength: 0, maxLength: 10 }),
        (query, prompts) => {
          const results = filterPrompts(prompts, query, 'all', 'library');
          const resultIds = new Set(results.map((r) => r.id));

          for (const prompt of prompts) {
            if (!prompt.archived && matchesQuery(prompt, query)) {
              expect(resultIds.has(prompt.id)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
