import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SearchEngine } from '../search-engine';
import type { PromptRecipe } from '../../types/index';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const engine = new SearchEngine();

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  const now = new Date();
  return {
    id: 'id-1',
    workspaceId: 'ws-1',
    title: '',
    description: '',
    body: '',
    tags: [],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

// ─── Generators ────────────────────────────────────────────────────────────────

/** Generates a safe string that won't accidentally contain the query keyword */
const safeStringArb = fc.stringMatching(/^[a-zA-Z0-9 ]{0,40}$/);

/** Generates a valid tag string */
const tagArb = fc.stringMatching(/^[a-zA-Z0-9]{1,15}$/);

/** Generates a PromptRecipe arbitrary */
const promptRecipeArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.uuid(),
  title: safeStringArb,
  description: safeStringArb,
  body: safeStringArb,
  tags: fc.array(tagArb, { minLength: 0, maxLength: 5 }),
  folderId: fc.option(fc.uuid(), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.boolean(),
  archivedAt: fc.option(fc.date(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  lastUsedAt: fc.option(fc.date(), { nil: null }),
  createdBy: fc.constantFrom('local', 'user-123', 'user-456'),
  version: fc.nat({ max: 1000 }),
});

/** Generates a non-empty collection of PromptRecipe objects */
const promptCollectionArb = fc.array(promptRecipeArb, { minLength: 1, maxLength: 20 });

/** Generates a non-empty search query */
const queryArb = fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/);

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('SearchEngine — Unit Tests', () => {
  it('should return all non-archived prompts for an empty query', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Alpha', archived: false }),
      makePrompt({ id: '2', title: 'Beta', archived: true }),
      makePrompt({ id: '3', title: 'Gamma', archived: false }),
    ];
    const results = engine.search(prompts, '');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('should exclude archived prompts from search results', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Test Prompt', archived: false }),
      makePrompt({ id: '2', title: 'Test Archived', archived: true }),
    ];
    const results = engine.search(prompts, 'Test');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('can include archived prompts when requested', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Test Prompt', archived: false }),
      makePrompt({ id: '2', title: 'Test Archived', archived: true }),
    ];
    const results = engine.search(prompts, 'Test', { includeArchived: true });

    expect(results.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('can restrict matching to selected fields', () => {
    const prompts = [
      makePrompt({ id: 'body-match', title: 'Unrelated', body: 'deploy checklist' }),
      makePrompt({ id: 'title-match', title: 'deploy pipeline', body: 'Unrelated' }),
    ];
    const results = engine.search(prompts, 'deploy', { fields: ['title'] });

    expect(results.map((r) => r.id)).toEqual(['title-match']);
  });

  it('should rank title matches above tag matches', () => {
    const prompts = [
      makePrompt({ id: 'tag-match', title: 'Unrelated', tags: ['deploy'], body: '' }),
      makePrompt({ id: 'title-match', title: 'deploy pipeline', tags: [], body: '' }),
    ];
    const results = engine.search(prompts, 'deploy');
    expect(results[0].id).toBe('title-match');
    expect(results[1].id).toBe('tag-match');
  });

  it('should rank tag matches above description matches', () => {
    const prompts = [
      makePrompt({ id: 'desc-match', title: 'Unrelated', description: 'refactor code', tags: [], body: '' }),
      makePrompt({ id: 'tag-match', title: 'Unrelated', description: '', tags: ['refactor'], body: '' }),
    ];
    const results = engine.search(prompts, 'refactor');
    expect(results[0].id).toBe('tag-match');
    expect(results[1].id).toBe('desc-match');
  });

  it('should rank description matches above body matches', () => {
    const prompts = [
      makePrompt({ id: 'body-match', title: 'Unrelated', description: '', body: 'optimize query' }),
      makePrompt({ id: 'desc-match', title: 'Unrelated', description: 'optimize query', body: '' }),
    ];
    const results = engine.search(prompts, 'optimize');
    expect(results[0].id).toBe('desc-match');
    expect(results[1].id).toBe('body-match');
  });

  it('should perform case-insensitive matching', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Hello World' }),
    ];
    const lower = engine.search(prompts, 'hello world');
    const upper = engine.search(prompts, 'HELLO WORLD');
    const mixed = engine.search(prompts, 'hElLo WoRlD');
    expect(lower).toHaveLength(1);
    expect(upper).toHaveLength(1);
    expect(mixed).toHaveLength(1);
  });

  it('should return empty results when no prompts match', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Alpha', description: 'First', body: 'Content', tags: ['a'] }),
    ];
    const results = engine.search(prompts, 'zzzznotfound');
    expect(results).toHaveLength(0);
  });

  it('should return empty results for an empty collection', () => {
    const results = engine.search([], 'anything');
    expect(results).toHaveLength(0);
  });

  it('should match on body content', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Unrelated', body: 'Please summarize the following text' }),
    ];
    const results = engine.search(prompts, 'summarize');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 10: Search Excludes Archived Prompts', () => {
  /**
   * **Validates: Requirements 14.3, 14.5**
   *
   * For any collection of PromptRecipe objects (some archived, some not) and for any
   * search query (including empty), the Search_Engine SHALL return results that contain
   * no archived prompts, and when the query is empty, the results SHALL contain all
   * non-archived prompts.
   */
  it('should never return archived prompts and empty query returns all non-archived', () => {
    fc.assert(
      fc.property(
        promptCollectionArb,
        fc.oneof(fc.constant(''), queryArb),
        (prompts, query) => {
          const results = engine.search(prompts, query);

          // No archived prompts in results
          for (const r of results) {
            expect(r.archived).toBe(false);
          }

          // Empty query returns ALL non-archived prompts
          if (query.trim() === '') {
            const nonArchived = prompts.filter((p) => !p.archived);
            expect(results).toHaveLength(nonArchived.length);
            const resultIds = new Set(results.map((r) => r.id));
            for (const p of nonArchived) {
              expect(resultIds.has(p.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 11: Search Case Insensitivity', () => {
  /**
   * **Validates: Requirements 14.4**
   *
   * For any collection of PromptRecipe objects and for any search query string,
   * searching with the query in all-uppercase SHALL return the same set of results
   * as searching with the query in all-lowercase.
   */
  it('should return the same result set for uppercase and lowercase queries', () => {
    fc.assert(
      fc.property(
        promptCollectionArb,
        queryArb,
        (prompts, query) => {
          const upperResults = engine.search(prompts, query.toUpperCase());
          const lowerResults = engine.search(prompts, query.toLowerCase());

          const upperIds = upperResults.map((r) => r.id);
          const lowerIds = lowerResults.map((r) => r.id);

          // Same set of results (same IDs in same order since ranking is deterministic)
          expect(upperIds).toEqual(lowerIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 12: Search Recall for Exact Title Match', () => {
  /**
   * **Validates: Requirements 14.6**
   *
   * For any non-archived PromptRecipe in the collection, searching with a query string
   * equal to that recipe's exact title SHALL include that recipe in the results.
   */
  it('should include a non-archived prompt when searching by its exact title', () => {
    fc.assert(
      fc.property(
        promptCollectionArb,
        (prompts) => {
          // Pick a non-archived prompt with a non-empty title
          const nonArchived = prompts.filter((p) => !p.archived && p.title.trim().length > 0);
          if (nonArchived.length === 0) return; // skip if no suitable prompt

          // Pick the first non-archived prompt with a non-empty title
          const target = nonArchived[0];
          const results = engine.search(prompts, target.title);
          const resultIds = results.map((r) => r.id);

          expect(resultIds).toContain(target.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 13: Search Ranking by Field Priority', () => {
  /**
   * **Validates: Requirements 14.2**
   *
   * For any search query that matches one PromptRecipe only in the title and another
   * only in the body, the title-matched recipe SHALL appear before the body-matched
   * recipe in the results.
   */
  it('should rank title-only match before body-only match', () => {
    fc.assert(
      fc.property(
        queryArb,
        fc.uuid(),
        fc.uuid(),
        (query, titleId, bodyId) => {
          // Ensure the two prompts have distinct IDs
          fc.pre(titleId !== bodyId);

          // Use a unique marker that won't appear in the "safe" fields
          const marker = query;

          // Build a prompt that matches ONLY in title (not in tags, description, or body)
          const titlePrompt = makePrompt({
            id: titleId,
            title: `prefix ${marker} suffix`,
            description: 'nothing here',
            body: 'nothing here either',
            tags: ['unrelated'],
            archived: false,
          });

          // Build a prompt that matches ONLY in body (not in title, tags, or description)
          const bodyPrompt = makePrompt({
            id: bodyId,
            title: 'completely different',
            description: 'also different',
            body: `some text ${marker} more text`,
            tags: ['other'],
            archived: false,
          });

          // Verify our setup: marker should not appear in the wrong fields
          fc.pre(!titlePrompt.body.toLowerCase().includes(marker.toLowerCase()));
          fc.pre(!titlePrompt.description.toLowerCase().includes(marker.toLowerCase()));
          fc.pre(!titlePrompt.tags.some((t) => t.toLowerCase().includes(marker.toLowerCase())));
          fc.pre(!bodyPrompt.title.toLowerCase().includes(marker.toLowerCase()));
          fc.pre(!bodyPrompt.description.toLowerCase().includes(marker.toLowerCase()));
          fc.pre(!bodyPrompt.tags.some((t) => t.toLowerCase().includes(marker.toLowerCase())));

          const results = engine.search([bodyPrompt, titlePrompt], marker);
          const resultIds = results.map((r) => r.id);

          // Both should appear
          expect(resultIds).toContain(titleId);
          expect(resultIds).toContain(bodyId);

          // Title match should come first
          const titleIndex = resultIds.indexOf(titleId);
          const bodyIndex = resultIds.indexOf(bodyId);
          expect(titleIndex).toBeLessThan(bodyIndex);
        }
      ),
      { numRuns: 100 }
    );
  });
});
