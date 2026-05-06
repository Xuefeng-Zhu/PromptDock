import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ImportExportService } from '../import-export';
import type { PromptRecipe } from '../../types/index';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const service = new ImportExportService();

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  const now = new Date();
  return {
    id: 'id-1',
    workspaceId: 'ws-1',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello {{name}}',
    tags: ['test'],
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

/** Non-empty string for title (import requires non-empty title) */
const titleArb = fc.stringMatching(/^[a-zA-Z0-9 ]{1,40}$/).filter((value) => value.trim().length > 0);

/** Non-empty string for body (import requires non-empty trimmed body) */
const bodyArb = fc.stringMatching(/^[a-zA-Z0-9 {}]{1,80}$/).filter((value) => value.trim().length > 0);

/** String for description */
const descriptionArb = fc.stringMatching(/^[a-zA-Z0-9 ]{0,40}$/);

/** Tag string */
const tagArb = fc.stringMatching(/^[a-zA-Z0-9]{1,15}$/);

/** Valid date generator (avoids NaN dates) */
const validDateArb = fc.integer({ min: 946684800000, max: 1924905600000 }).map((ts) => new Date(ts));

/** Generates a non-archived PromptRecipe arbitrary */
const nonArchivedPromptArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.uuid(),
  title: titleArb,
  description: descriptionArb,
  body: bodyArb,
  tags: fc.array(tagArb, { minLength: 0, maxLength: 5 }),
  folderId: fc.option(fc.uuid(), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.constant(false),
  archivedAt: fc.constant(null),
  createdAt: validDateArb,
  updatedAt: validDateArb,
  lastUsedAt: fc.option(validDateArb, { nil: null }),
  createdBy: fc.constantFrom('local', 'user-123'),
  version: fc.nat({ max: 1000 }),
});

/** Generates a PromptRecipe that may or may not be archived */
const promptRecipeArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.uuid(),
  title: titleArb,
  description: descriptionArb,
  body: bodyArb,
  tags: fc.array(tagArb, { minLength: 0, maxLength: 5 }),
  folderId: fc.option(fc.uuid(), { nil: null }),
  favorite: fc.boolean(),
  archived: fc.boolean(),
  archivedAt: fc.option(validDateArb, { nil: null }),
  createdAt: validDateArb,
  updatedAt: validDateArb,
  lastUsedAt: fc.option(validDateArb, { nil: null }),
  createdBy: fc.constantFrom('local', 'user-123'),
  version: fc.nat({ max: 1000 }),
});

/** Collection of non-archived prompts */
const nonArchivedCollectionArb = fc.array(nonArchivedPromptArb, { minLength: 1, maxLength: 15 });

/** Collection of mixed (archived + non-archived) prompts */
const mixedCollectionArb = fc.array(promptRecipeArb, { minLength: 1, maxLength: 15 });

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('ImportExportService — Unit Tests', () => {
  it('should export prompts to valid JSON with schema fields', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Alpha', body: 'Body A' }),
      makePrompt({ id: '2', title: 'Beta', body: 'Body B' }),
    ];
    const json = service.exportToJSON(prompts);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1.0');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.prompts).toHaveLength(2);
    expect(parsed.prompts[0].title).toBe('Alpha');
    expect(parsed.prompts[1].title).toBe('Beta');
  });

  it('should import valid JSON and produce PromptRecipe objects', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: 'Imported Prompt', body: 'Some body text' },
      ],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].title).toBe('Imported Prompt');
      expect(result.prompts[0].body).toBe('Some body text');
      expect(result.prompts[0].id).toBeDefined();
    }
  });

  it('should trim imported prompt title and body', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: '  Imported Prompt  ', body: '  Some body text  ' },
      ],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.prompts[0].title).toBe('Imported Prompt');
      expect(result.prompts[0].body).toBe('Some body text');
    }
  });

  it('should reject prompts with blank titles or bodies', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        { title: '   ', body: 'Body' },
        { title: 'Title', body: '' },
        { title: 'Another title', body: '   ' },
      ],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
      expect(result.errors.filter((e) => e.includes('body'))).toHaveLength(2);
    }
  });

  it('should return validation errors for invalid JSON schema', () => {
    const json = JSON.stringify({ foo: 'bar' });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject unsupported export versions and invalid export timestamps', () => {
    const json = JSON.stringify({
      version: '999.0',
      exportedAt: 'not a date',
      prompts: [],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('Unsupported export version'))).toBe(true);
      expect(result.errors.some((e) => e.includes('exportedAt'))).toBe(true);
    }
  });

  it('should return validation errors for malformed JSON', () => {
    const result = service.importFromJSON('not valid json {{{');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should return validation errors when prompts are missing required fields', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [{ description: 'no title or body' }],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    }
  });

  it('should reject prompts with invalid optional field types', () => {
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: [
        {
          title: 'Invalid prompt',
          body: 'Body',
          tags: ['ok', 42],
          folderId: 12,
          favorite: 'yes',
          createdAt: 'not a date',
          updatedAt: 'also not a date',
        },
      ],
    });
    const result = service.importFromJSON(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('tags'))).toBe(true);
      expect(result.errors.some((e) => e.includes('folderId'))).toBe(true);
      expect(result.errors.some((e) => e.includes('favorite'))).toBe(true);
      expect(result.errors.some((e) => e.includes('createdAt'))).toBe(true);
      expect(result.errors.some((e) => e.includes('updatedAt'))).toBe(true);
    }
  });

  it('should detect duplicates by title and body', () => {
    const existing = [makePrompt({ id: 'e1', title: 'Shared Title', body: 'Shared Body' })];
    const incoming = [makePrompt({ id: 'i1', title: 'Shared Title', body: 'Shared Body' })];

    const duplicates = service.detectDuplicates(incoming, existing);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchedOn).toBe('both');
  });

  it('should detect duplicates by title only', () => {
    const existing = [makePrompt({ id: 'e1', title: 'Same Title', body: 'Different body A' })];
    const incoming = [makePrompt({ id: 'i1', title: 'Same Title', body: 'Different body B' })];

    const duplicates = service.detectDuplicates(incoming, existing);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchedOn).toBe('title');
  });

  it('should detect duplicates by body only', () => {
    const existing = [makePrompt({ id: 'e1', title: 'Title A', body: 'Same body content' })];
    const incoming = [makePrompt({ id: 'i1', title: 'Title B', body: 'Same body content' })];

    const duplicates = service.detectDuplicates(incoming, existing);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchedOn).toBe('body');
  });

  it('should return empty duplicates when no matches exist', () => {
    const existing = [makePrompt({ id: 'e1', title: 'Existing', body: 'Existing body' })];
    const incoming = [makePrompt({ id: 'i1', title: 'New', body: 'New body' })];

    const duplicates = service.detectDuplicates(incoming, existing);
    expect(duplicates).toHaveLength(0);
  });

  it('should exclude archived prompts from export', () => {
    const prompts = [
      makePrompt({ id: '1', title: 'Active', archived: false }),
      makePrompt({ id: '2', title: 'Archived', archived: true }),
    ];
    const json = service.exportToJSON(prompts);
    const parsed = JSON.parse(json);

    expect(parsed.prompts).toHaveLength(1);
    expect(parsed.prompts[0].title).toBe('Active');
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 17: Import/Export Round-Trip', () => {
  /**
   * **Validates: Requirements 19.5**
   *
   * For any collection of non-archived PromptRecipe objects, exporting to JSON and
   * importing back SHALL produce equivalent recipes (matching on title, description,
   * body, tags).
   */
  it('should round-trip: export then import produces equivalent recipes', () => {
    fc.assert(
      fc.property(
        nonArchivedCollectionArb,
        (prompts) => {
          const json = service.exportToJSON(prompts);
          const result = service.importFromJSON(json);

          expect(result.success).toBe(true);
          if (!result.success) return;

          expect(result.prompts).toHaveLength(prompts.length);

          // Sort both by title+body for stable comparison
          const sortKey = (p: { title: string; body: string }) => `${p.title.trim()}|||${p.body.trim()}`;
          const originalSorted = [...prompts].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
          const importedSorted = [...result.prompts].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

          for (let i = 0; i < originalSorted.length; i++) {
            expect(importedSorted[i].title).toBe(originalSorted[i].title.trim());
            expect(importedSorted[i].body).toBe(originalSorted[i].body.trim());

            // Description: export only includes non-empty descriptions
            const expectedDesc = originalSorted[i].description || '';
            expect(importedSorted[i].description).toBe(expectedDesc);

            // Tags: export only includes non-empty tag arrays
            const expectedTags = originalSorted[i].tags.length > 0 ? originalSorted[i].tags : [];
            expect(importedSorted[i].tags).toEqual(expectedTags);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 18: Export Produces Valid Schema JSON', () => {
  /**
   * **Validates: Requirements 19.6**
   *
   * For any collection of valid PromptRecipe objects, exporting SHALL produce a JSON
   * string that, when parsed, conforms to the PromptDock export schema (has `version`,
   * `exportedAt`, and `prompts` array with required fields).
   */
  it('should produce valid schema JSON for any collection', () => {
    fc.assert(
      fc.property(
        mixedCollectionArb,
        (prompts) => {
          const json = service.exportToJSON(prompts);
          const parsed = JSON.parse(json);

          // Top-level schema fields
          expect(typeof parsed.version).toBe('string');
          expect(parsed.version).toBe('1.0');
          expect(typeof parsed.exportedAt).toBe('string');
          // exportedAt should be a valid ISO date string
          expect(isNaN(Date.parse(parsed.exportedAt))).toBe(false);
          expect(Array.isArray(parsed.prompts)).toBe(true);

          // Each prompt in the array has required fields
          for (const prompt of parsed.prompts) {
            expect(typeof prompt.title).toBe('string');
            expect(typeof prompt.body).toBe('string');
            // Optional fields, if present, have correct types
            if ('description' in prompt) {
              expect(typeof prompt.description).toBe('string');
            }
            if ('tags' in prompt) {
              expect(Array.isArray(prompt.tags)).toBe(true);
            }
            if ('favorite' in prompt) {
              expect(typeof prompt.favorite).toBe('boolean');
            }
            if ('createdAt' in prompt) {
              expect(typeof prompt.createdAt).toBe('string');
            }
            if ('updatedAt' in prompt) {
              expect(typeof prompt.updatedAt).toBe('string');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 19: Export Contains All Non-Archived Prompts', () => {
  /**
   * **Validates: Requirements 19.1**
   *
   * For any collection of PromptRecipe objects (some archived, some not), exporting
   * SHALL produce a JSON document whose prompts array contains exactly the non-archived
   * recipes from the input collection.
   */
  it('should export exactly the non-archived prompts', () => {
    fc.assert(
      fc.property(
        mixedCollectionArb,
        (prompts) => {
          const json = service.exportToJSON(prompts);
          const parsed = JSON.parse(json);

          const nonArchived = prompts.filter((p) => !p.archived);
          expect(parsed.prompts).toHaveLength(nonArchived.length);

          // Verify each non-archived prompt's title appears in the export
          const exportedTitles = parsed.prompts.map((p: { title: string }) => p.title);
          for (const p of nonArchived) {
            expect(exportedTitles).toContain(p.title);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 20: Import Schema Validation Rejects Invalid JSON', () => {
  /**
   * **Validates: Requirements 19.2**
   *
   * For any JSON that doesn't conform to the schema, import SHALL return a validation
   * error with a non-empty list of schema violations.
   */
  it('should reject malformed JSON strings', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid JSON
        fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*()]{1,50}$/),
        (invalidStr) => {
          // Ensure it's not accidentally valid JSON
          let isValidJson = true;
          try {
            JSON.parse(invalidStr);
          } catch {
            isValidJson = false;
          }
          fc.pre(!isValidJson);

          const result = service.importFromJSON(invalidStr);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject JSON objects missing required top-level fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate objects that are missing at least one required field
          randomKey: fc.string(),
          anotherKey: fc.nat(),
        }),
        (obj) => {
          // Ensure the object doesn't accidentally have all required fields
          const hasVersion = 'version' in obj && typeof (obj as Record<string, unknown>).version === 'string';
          const hasExportedAt = 'exportedAt' in obj && typeof (obj as Record<string, unknown>).exportedAt === 'string';
          const hasPrompts = 'prompts' in obj && Array.isArray((obj as Record<string, unknown>).prompts);
          fc.pre(!(hasVersion && hasExportedAt && hasPrompts));

          const json = JSON.stringify(obj);
          const result = service.importFromJSON(json);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject JSON with prompts missing required fields (title/body)', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.string(),
          tags: fc.array(fc.string(), { maxLength: 3 }),
        }),
        (promptData) => {
          // Prompt is missing title and body
          const json = JSON.stringify({
            version: '1.0',
            exportedAt: new Date().toISOString(),
            prompts: [promptData],
          });

          const result = service.importFromJSON(json);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 21: Import Duplicate Detection', () => {
  /**
   * **Validates: Requirements 19.4**
   *
   * For any pair of collections where at least one incoming recipe shares title and
   * body with an existing recipe, detectDuplicates SHALL return a non-empty list.
   */
  it('should detect duplicates when incoming shares title AND body with existing', () => {
    fc.assert(
      fc.property(
        nonArchivedCollectionArb,
        nonArchivedCollectionArb,
        titleArb,
        bodyArb,
        (existingBase, incomingBase, sharedTitle, sharedBody) => {
          // Create an existing prompt with the shared title and body
          const existingPrompt = makePrompt({
            id: 'existing-shared',
            title: sharedTitle,
            body: sharedBody,
          });

          // Create an incoming prompt with the same title and body but different id
          const incomingPrompt = makePrompt({
            id: 'incoming-shared',
            title: sharedTitle,
            body: sharedBody,
          });

          const existing = [...existingBase, existingPrompt];
          const incoming = [...incomingBase, incomingPrompt];

          const duplicates = service.detectDuplicates(incoming, existing);
          expect(duplicates.length).toBeGreaterThan(0);

          // At least one duplicate should involve the shared title+body pair
          const hasTitleBodyMatch = duplicates.some(
            (d) =>
              d.incoming.title === sharedTitle &&
              d.incoming.body === sharedBody &&
              d.existing.title === sharedTitle &&
              d.existing.body === sharedBody
          );
          expect(hasTitleBodyMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
