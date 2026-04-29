import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ImportExportService } from '../import-export';
import type { PromptRecipe } from '../../types';

const service = new ImportExportService();

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: '1', workspaceId: 'w1', title: 'Test', description: 'desc', body: 'body',
    tags: ['tag'], folderId: null, favorite: false, archived: false, archivedAt: null,
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'), lastUsedAt: null,
    createdBy: 'local', version: 1,
    ...overrides,
  };
}

describe('ImportExportService', () => {
  it('exports valid JSON', () => {
    const json = service.exportToJSON([makePrompt()]);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.prompts).toHaveLength(1);
  });

  it('imports valid JSON', () => {
    const json = service.exportToJSON([makePrompt()]);
    const result = service.importFromJSON(json);
    expect(result.success).toBe(true);
  });

  it('rejects invalid JSON', () => {
    const result = service.importFromJSON('not json');
    expect(result.success).toBe(false);
  });

  it('rejects missing schema fields', () => {
    const result = service.importFromJSON(JSON.stringify({ prompts: [] }));
    expect(result.success).toBe(false);
  });

  it('detects duplicates by title', () => {
    const a = makePrompt({ title: 'Same', body: 'different1' });
    const b = makePrompt({ title: 'Same', body: 'different2' });
    const dupes = service.detectDuplicates([a], [b]);
    expect(dupes).toHaveLength(1);
    expect(dupes[0].matchedOn).toBe('title');
  });

  // Property 17: Round-trip
  it('P17: export/import round-trip preserves prompts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 20 }),
            body: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          const prompts = items.map((item, i) => makePrompt({ id: String(i), ...item }));
          const json = service.exportToJSON(prompts);
          const result = service.importFromJSON(json);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.prompts.length).toBe(prompts.length);
            for (let i = 0; i < prompts.length; i++) {
              expect(result.prompts[i].title).toBe(prompts[i].title);
              expect(result.prompts[i].body).toBe(prompts[i].body);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18: Export produces valid schema
  it('P18: export always produces valid schema', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ title: fc.string({ minLength: 1, maxLength: 10 }), body: fc.string({ minLength: 1, maxLength: 10 }) }),
          { maxLength: 5 }
        ),
        (items) => {
          const prompts = items.map((item, i) => makePrompt({ id: String(i), ...item }));
          const json = service.exportToJSON(prompts);
          const parsed = JSON.parse(json);
          expect(parsed.version).toBe('1.0');
          expect(typeof parsed.exportedAt).toBe('string');
          expect(Array.isArray(parsed.prompts)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19: Export excludes archived
  it('P19: export contains only non-archived prompts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ archived: fc.boolean(), title: fc.string({ minLength: 1, maxLength: 10 }) }), { minLength: 1, maxLength: 5 }),
        (items) => {
          const prompts = items.map((item, i) => makePrompt({ id: String(i), ...item }));
          const json = service.exportToJSON(prompts);
          const parsed = JSON.parse(json);
          const nonArchived = prompts.filter((p) => !p.archived);
          expect(parsed.prompts.length).toBe(nonArchived.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 20: Rejects invalid schema
  it('P20: rejects invalid JSON structures', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.constant([])),
        (value) => {
          const json = JSON.stringify(value);
          const result = service.importFromJSON(json);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 21: Duplicate detection
  it('P21: detects duplicates when title and body match', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (title, body) => {
          const incoming = [makePrompt({ id: 'a', title, body })];
          const existing = [makePrompt({ id: 'b', title, body })];
          const dupes = service.detectDuplicates(incoming, existing);
          expect(dupes.length).toBeGreaterThanOrEqual(1);
          expect(dupes[0].matchedOn).toBe('both');
        }
      ),
      { numRuns: 100 }
    );
  });
});
