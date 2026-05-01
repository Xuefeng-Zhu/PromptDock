import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeFilterCounts,
  computeFolderCounts,
  computeTagCounts,
} from '../../utils/sidebar-counts';
import type { PromptRecipe } from '../../types/index';

// ─── Generators ────────────────────────────────────────────────────────────────

/**
 * Generate a valid PromptRecipe with constrained random values.
 */
function promptRecipeArb(): fc.Arbitrary<PromptRecipe> {
  return fc.record({
    id: fc.uuid(),
    workspaceId: fc.constant('local'),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 100 }),
    body: fc.string({ maxLength: 200 }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
    folderId: fc.oneof(fc.constant(null), fc.stringMatching(/^folder-[a-z]{1,10}$/)),
    favorite: fc.boolean(),
    archived: fc.boolean(),
    archivedAt: fc.oneof(fc.constant(null), fc.date()),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    lastUsedAt: fc.oneof(fc.constant(null), fc.date()),
    createdBy: fc.constant('local'),
    version: fc.nat({ max: 100 }),
  });
}

/**
 * Generate a list of PromptRecipe objects.
 */
function promptListArb(): fc.Arbitrary<PromptRecipe[]> {
  return fc.array(promptRecipeArb(), { minLength: 0, maxLength: 30 });
}

// ─── Property 2: Sidebar filter counts are consistent with prompt data ─────────

describe('Property 2: Sidebar filter counts are consistent with prompt data', () => {
  /**
   * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
   */
  it('for any list of prompts, sidebar filter counts (total, favorites, recent, archived) match expected values', () => {
    fc.assert(
      fc.property(
        promptListArb(),
        fc.date(),
        (prompts, referenceDate) => {
          const counts = computeFilterCounts(prompts, referenceDate);

          // Total = non-archived prompts
          const expectedTotal = prompts.filter((p) => !p.archived).length;
          expect(counts.total).toBe(expectedTotal);

          // Favorites = non-archived AND favorite === true
          const expectedFavorites = prompts.filter((p) => !p.archived && p.favorite).length;
          expect(counts.favorites).toBe(expectedFavorites);

          // Recent = non-archived AND lastUsedAt within 7 days of referenceDate
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          const recentThreshold = referenceDate.getTime() - sevenDaysMs;
          const expectedRecent = prompts.filter(
            (p) => !p.archived && p.lastUsedAt !== null && p.lastUsedAt.getTime() > recentThreshold,
          ).length;
          expect(counts.recent).toBe(expectedRecent);

          // Archived = prompts where archived === true
          const expectedArchived = prompts.filter((p) => p.archived).length;
          expect(counts.archived).toBe(expectedArchived);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 3: Sidebar folder counts match grouped prompt data ───────────────

describe('Property 3: Sidebar folder counts match grouped prompt data', () => {
  /**
   * **Validates: Requirements 15.5**
   */
  it('for any list of prompts, folder counts match grouped non-archived prompt counts', () => {
    fc.assert(
      fc.property(promptListArb(), (prompts) => {
        const folderCounts = computeFolderCounts(prompts);

        const nonArchived = prompts.filter((p) => !p.archived);

        // Each folderId key maps to the count of non-archived prompts with that folderId
        const expectedCounts: Record<string, number> = Object.create(null);
        for (const p of nonArchived) {
          if (p.folderId) {
            expectedCounts[p.folderId] = (expectedCounts[p.folderId] ?? 0) + 1;
          }
        }

        expect(folderCounts).toEqual(expectedCounts);

        // Sum of all folder counts + prompts with folderId === null equals total non-archived count
        const folderCountSum = Object.values(folderCounts).reduce((sum, c) => sum + c, 0);
        const nullFolderCount = nonArchived.filter((p) => p.folderId === null).length;
        expect(folderCountSum + nullFolderCount).toBe(nonArchived.length);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 4: Sidebar tag counts match aggregated prompt data ───────────────

describe('Property 4: Sidebar tag counts match aggregated prompt data', () => {
  /**
   * **Validates: Requirements 16.4**
   */
  it('for any list of prompts, tag counts match aggregated tag occurrences across non-archived prompts', () => {
    fc.assert(
      fc.property(promptListArb(), (prompts) => {
        const tagCounts = computeTagCounts(prompts);

        const nonArchived = prompts.filter((p) => !p.archived);

        // Each tag key maps to the number of non-archived prompts that include that tag
        const expectedCounts: Record<string, number> = Object.create(null);
        for (const p of nonArchived) {
          for (const tag of p.tags) {
            expectedCounts[tag] = (expectedCounts[tag] ?? 0) + 1;
          }
        }

        expect(tagCounts).toEqual(expectedCounts);

        // Every tag present in any non-archived prompt appears in the mapping
        const allTags = new Set<string>();
        for (const p of nonArchived) {
          for (const tag of p.tags) {
            allTags.add(tag);
          }
        }
        for (const tag of allTags) {
          expect(tag in tagCounts).toBe(true);
          expect(tagCounts[tag]).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});
