import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SearchEngine } from '../search-engine';
import type { PromptRecipe } from '../../types';

const engine = new SearchEngine();

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: '1', workspaceId: 'w1', title: '', description: '', body: '',
    tags: [], folderId: null, favorite: false, archived: false, archivedAt: null,
    createdAt: new Date(), updatedAt: new Date(), lastUsedAt: null, createdBy: 'local', version: 1,
    ...overrides,
  };
}

describe('SearchEngine', () => {
  it('ranks title matches highest', () => {
    const prompts = [
      makePrompt({ id: '1', body: 'test' }),
      makePrompt({ id: '2', title: 'test' }),
    ];
    const results = engine.search(prompts, 'test');
    expect(results[0].id).toBe('2');
  });

  it('ranks tag matches above body', () => {
    const prompts = [
      makePrompt({ id: '1', body: 'test' }),
      makePrompt({ id: '2', tags: ['test'] }),
    ];
    const results = engine.search(prompts, 'test');
    expect(results[0].id).toBe('2');
  });

  it('performs case-insensitive matching', () => {
    const prompts = [makePrompt({ title: 'Hello World' })];
    expect(engine.search(prompts, 'hello world')).toHaveLength(1);
  });

  it('excludes archived prompts', () => {
    const prompts = [makePrompt({ archived: true, title: 'test' })];
    expect(engine.search(prompts, 'test')).toHaveLength(0);
  });

  it('returns all non-archived on empty query', () => {
    const prompts = [
      makePrompt({ id: '1' }),
      makePrompt({ id: '2', archived: true }),
    ];
    expect(engine.search(prompts, '')).toHaveLength(1);
  });

  // Property 10: Search excludes archived
  it('P10: never returns archived prompts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          archived: fc.boolean(),
          title: fc.string({ minLength: 1, maxLength: 20 }),
        }), { minLength: 1, maxLength: 10 }),
        fc.string({ maxLength: 10 }),
        (items, query) => {
          const prompts = items.map((item, i) => makePrompt({ id: String(i), ...item }));
          const results = engine.search(prompts, query);
          expect(results.every((r) => !r.archived)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 11: Case insensitivity
  it('P11: case insensitive search', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{1,10}$/),
        (query) => {
          const prompts = [makePrompt({ title: query })];
          const upper = engine.search(prompts, query.toUpperCase());
          const lower = engine.search(prompts, query.toLowerCase());
          expect(upper.length).toBe(lower.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 12: Exact title recall
  it('P12: exact title match is always found', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        (title) => {
          const prompts = [makePrompt({ title })];
          const results = engine.search(prompts, title);
          expect(results.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 13: Title match ranks above body match
  it('P13: title match ranks above body-only match', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z]{2,10}$/),
        (query) => {
          const titleMatch = makePrompt({ id: 'title', title: query });
          const bodyMatch = makePrompt({ id: 'body', body: query });
          const results = engine.search([bodyMatch, titleMatch], query);
          if (results.length >= 2) {
            expect(results[0].id).toBe('title');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
