import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { appReducer } from '../AppShell';
import type { AppState, FilterType } from '../AppShell';
import type { PromptRecipe, Folder } from '../../types/index';

/**
 * Feature: prompt-dock-ui
 * Property 6: State preservation across editor round-trip navigation
 *
 * For any AppState with non-empty searchQuery and any activeFilter,
 * navigating Library → Editor → Library preserves searchQuery and activeFilter.
 *
 * **Validates: Requirements 12.3**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

const filterTypeArb: fc.Arbitrary<FilterType> = fc.constantFrom('all', 'favorites', 'recent');

const promptRecipeArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  workspaceId: fc.string({ minLength: 1, maxLength: 10 }),
  title: fc.string({ maxLength: 50 }),
  description: fc.string({ maxLength: 100 }),
  body: fc.string({ maxLength: 200 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 5 }),
  folderId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.boolean(),
  archivedAt: fc.option(fc.date(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  lastUsedAt: fc.option(fc.date(), { nil: null }),
  createdBy: fc.string({ minLength: 1, maxLength: 10 }),
  version: fc.nat({ max: 100 }),
});

const folderArb: fc.Arbitrary<Folder> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/** AppState starting on the library screen with a non-empty searchQuery */
const libraryStateArb: fc.Arbitrary<AppState> = fc.record({
  screen: fc.constant({ name: 'library' as const }),
  selectedPromptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  searchQuery: fc.string({ minLength: 1, maxLength: 50 }),
  activeFilter: filterTypeArb,
  activeSidebarItem: fc.string({ minLength: 1, maxLength: 20 }),
  commandPaletteOpen: fc.boolean(),
  variableFillPromptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  prompts: fc.array(promptRecipeArb, { maxLength: 5 }),
  folders: fc.array(folderArb, { maxLength: 3 }),
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 6: State preservation across editor round-trip navigation', () => {
  it('navigating Library → Editor → Library preserves searchQuery and activeFilter', () => {
    fc.assert(
      fc.property(
        libraryStateArb,
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        (state, promptId) => {
          // Step 1: Navigate to editor
          const afterEditor = appReducer(state, {
            type: 'NAVIGATE',
            screen: { name: 'editor', promptId },
          });

          // Step 2: Navigate back to library
          const afterReturn = appReducer(afterEditor, {
            type: 'NAVIGATE',
            screen: { name: 'library' },
          });

          // searchQuery and activeFilter should be preserved
          expect(afterReturn.searchQuery).toBe(state.searchQuery);
          expect(afterReturn.activeFilter).toBe(state.activeFilter);
        },
      ),
      { numRuns: 100 },
    );
  });
});
