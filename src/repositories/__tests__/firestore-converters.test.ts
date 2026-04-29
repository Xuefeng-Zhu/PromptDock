/**
 * Tests for Firestore data converter functions.
 *
 * Includes:
 * - Property 2: Firestore Converter Round-Trip (Validates: Requirements 7.8)
 * - Unit tests for round-trip conversion of PromptRecipe, Workspace, UserSettings (Requirements: 26.6)
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { PromptRecipe, Workspace, UserSettings } from '../../types/index';
import {
  promptRecipeToFirestoreDoc,
  firestoreDocToPromptRecipe,
  workspaceToFirestoreDoc,
  firestoreDocToWorkspace,
  userSettingsToFirestoreDoc,
  firestoreDocToUserSettings,
  dateToTimestamp,
  timestampToDate,
} from '../firestore-backend';

// ─── Arbitrary Generators ──────────────────────────────────────────────────────

/**
 * Generate a Date with millisecond precision (Firestore Timestamps preserve ms).
 * Constrained to a reasonable range to avoid edge cases with extreme dates.
 */
const arbDate = fc
  .integer({ min: 0, max: 4_102_444_800_000 }) // 2000-01-01 to 2100-01-01 in ms
  .map((ms) => new Date(ms));

/** Generate a nullable Date */
const arbNullableDate = fc.oneof(arbDate, fc.constant(null));

/** Generate a valid PromptRecipe */
const arbPromptRecipe: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.uuid(),
  workspaceId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ maxLength: 500 }),
  body: fc.string({ maxLength: 2000 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  folderId: fc.oneof(fc.uuid(), fc.constant(null)),
  favorite: fc.boolean(),
  archived: fc.boolean(),
  archivedAt: arbNullableDate,
  createdAt: arbDate,
  updatedAt: arbDate,
  lastUsedAt: arbNullableDate,
  createdBy: fc.string({ minLength: 1, maxLength: 100 }),
  version: fc.nat({ max: 10000 }),
});

/** Generate a valid Workspace */
const arbWorkspace: fc.Arbitrary<Workspace> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 200 }),
  ownerId: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: arbDate,
  updatedAt: arbDate,
});

/** Generate valid UserSettings */
const arbUserSettings: fc.Arbitrary<UserSettings> = fc.record({
  hotkeyCombo: fc.string({ minLength: 1, maxLength: 100 }),
  theme: fc.constantFrom('light' as const, 'dark' as const, 'system' as const),
  defaultAction: fc.constantFrom('copy' as const, 'paste' as const),
  activeWorkspaceId: fc.uuid(),
});

// ─── Helper: Deep equality for dates ───────────────────────────────────────────

/**
 * Compare two PromptRecipe objects for deep equality, accounting for
 * millisecond-level precision in Date conversions.
 */
function assertPromptRecipeEqual(original: PromptRecipe, roundTripped: PromptRecipe) {
  expect(roundTripped.id).toBe(original.id);
  expect(roundTripped.workspaceId).toBe(original.workspaceId);
  expect(roundTripped.title).toBe(original.title);
  expect(roundTripped.description).toBe(original.description);
  expect(roundTripped.body).toBe(original.body);
  expect(roundTripped.tags).toEqual(original.tags);
  expect(roundTripped.folderId).toBe(original.folderId);
  expect(roundTripped.favorite).toBe(original.favorite);
  expect(roundTripped.archived).toBe(original.archived);
  expect(roundTripped.createdBy).toBe(original.createdBy);
  expect(roundTripped.version).toBe(original.version);

  // Date comparisons with millisecond tolerance
  expect(roundTripped.createdAt.getTime()).toBe(original.createdAt.getTime());
  expect(roundTripped.updatedAt.getTime()).toBe(original.updatedAt.getTime());

  if (original.archivedAt === null) {
    expect(roundTripped.archivedAt).toBeNull();
  } else {
    expect(roundTripped.archivedAt!.getTime()).toBe(original.archivedAt.getTime());
  }

  if (original.lastUsedAt === null) {
    expect(roundTripped.lastUsedAt).toBeNull();
  } else {
    expect(roundTripped.lastUsedAt!.getTime()).toBe(original.lastUsedAt.getTime());
  }
}

// ─── Timestamp Converter Tests ─────────────────────────────────────────────────

describe('Timestamp converters', () => {
  it('should round-trip a Date through dateToTimestamp and timestampToDate', () => {
    const date = new Date('2024-06-15T10:30:00.123Z');
    const timestamp = dateToTimestamp(date);
    const result = timestampToDate(timestamp);
    expect(result.getTime()).toBe(date.getTime());
  });

  it('should handle epoch date', () => {
    const date = new Date(0);
    const timestamp = dateToTimestamp(date);
    const result = timestampToDate(timestamp);
    expect(result.getTime()).toBe(0);
  });
});

// ─── Property Test: Firestore Converter Round-Trip ─────────────────────────────

describe('Feature: prompt-dock, Property 2: Firestore Converter Round-Trip', () => {
  it('for any valid PromptRecipe, converting to Firestore doc and back produces a deeply equal object', () => {
    /**
     * **Validates: Requirements 7.8**
     *
     * For any valid PromptRecipe TypeScript object, converting it to a Firestore
     * document via the data converter and converting back SHALL produce an object
     * deeply equal to the original.
     */
    fc.assert(
      fc.property(arbPromptRecipe, (recipe) => {
        const firestoreDoc = promptRecipeToFirestoreDoc(recipe);
        const roundTripped = firestoreDocToPromptRecipe(recipe.id, firestoreDoc);
        assertPromptRecipeEqual(recipe, roundTripped);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Unit Tests: PromptRecipe Converter ────────────────────────────────────────

describe('PromptRecipe Firestore converter', () => {
  const sampleRecipe: PromptRecipe = {
    id: 'recipe-1',
    workspaceId: 'ws-1',
    title: 'Test Recipe',
    description: 'A test prompt recipe',
    body: 'Hello {{name}}, welcome to {{place}}!',
    tags: ['greeting', 'test'],
    folderId: 'folder-1',
    favorite: true,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-15T10:00:00.000Z'),
    updatedAt: new Date('2024-06-20T14:30:00.000Z'),
    lastUsedAt: new Date('2024-06-19T09:00:00.000Z'),
    createdBy: 'user-123',
    version: 3,
  };

  it('should round-trip a PromptRecipe with all fields populated', () => {
    const doc = promptRecipeToFirestoreDoc(sampleRecipe);
    const result = firestoreDocToPromptRecipe(sampleRecipe.id, doc);
    assertPromptRecipeEqual(sampleRecipe, result);
  });

  it('should round-trip a PromptRecipe with null optional fields', () => {
    const recipe: PromptRecipe = {
      ...sampleRecipe,
      folderId: null,
      archivedAt: null,
      lastUsedAt: null,
    };
    const doc = promptRecipeToFirestoreDoc(recipe);
    const result = firestoreDocToPromptRecipe(recipe.id, doc);
    assertPromptRecipeEqual(recipe, result);
  });

  it('should round-trip a PromptRecipe with archived state', () => {
    const recipe: PromptRecipe = {
      ...sampleRecipe,
      archived: true,
      archivedAt: new Date('2024-06-20T15:00:00.000Z'),
    };
    const doc = promptRecipeToFirestoreDoc(recipe);
    const result = firestoreDocToPromptRecipe(recipe.id, doc);
    assertPromptRecipeEqual(recipe, result);
  });

  it('should round-trip a PromptRecipe with empty tags', () => {
    const recipe: PromptRecipe = { ...sampleRecipe, tags: [] };
    const doc = promptRecipeToFirestoreDoc(recipe);
    const result = firestoreDocToPromptRecipe(recipe.id, doc);
    assertPromptRecipeEqual(recipe, result);
  });

  it('should preserve tag array without mutation', () => {
    const originalTags = ['a', 'b', 'c'];
    const recipe: PromptRecipe = { ...sampleRecipe, tags: originalTags };
    const doc = promptRecipeToFirestoreDoc(recipe);

    // Mutate the doc tags — should not affect the round-tripped result
    doc.tags.push('mutated');

    firestoreDocToPromptRecipe(recipe.id, doc);
    // The original recipe tags should be unchanged after conversion
    expect(originalTags).toEqual(['a', 'b', 'c']);
  });
});

// ─── Unit Tests: Workspace Converter ───────────────────────────────────────────

describe('Workspace Firestore converter', () => {
  const sampleWorkspace: Workspace = {
    id: 'ws-1',
    name: 'My Workspace',
    ownerId: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-15T12:00:00.000Z'),
  };

  it('should round-trip a Workspace', () => {
    const doc = workspaceToFirestoreDoc(sampleWorkspace);
    const result = firestoreDocToWorkspace(sampleWorkspace.id, doc);

    expect(result.id).toBe(sampleWorkspace.id);
    expect(result.name).toBe(sampleWorkspace.name);
    expect(result.ownerId).toBe(sampleWorkspace.ownerId);
    expect(result.createdAt.getTime()).toBe(sampleWorkspace.createdAt.getTime());
    expect(result.updatedAt.getTime()).toBe(sampleWorkspace.updatedAt.getTime());
  });

  it('should preserve all Workspace fields through conversion', () => {
    fc.assert(
      fc.property(arbWorkspace, (workspace) => {
        const doc = workspaceToFirestoreDoc(workspace);
        const result = firestoreDocToWorkspace(workspace.id, doc);

        expect(result.id).toBe(workspace.id);
        expect(result.name).toBe(workspace.name);
        expect(result.ownerId).toBe(workspace.ownerId);
        expect(result.createdAt.getTime()).toBe(workspace.createdAt.getTime());
        expect(result.updatedAt.getTime()).toBe(workspace.updatedAt.getTime());
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Unit Tests: UserSettings Converter ────────────────────────────────────────

describe('UserSettings Firestore converter', () => {
  const sampleSettings: UserSettings = {
    hotkeyCombo: 'CommandOrControl+Shift+P',
    theme: 'dark',
    defaultAction: 'copy',
    activeWorkspaceId: 'ws-1',
  };

  it('should round-trip UserSettings', () => {
    const doc = userSettingsToFirestoreDoc(sampleSettings);
    const result = firestoreDocToUserSettings(doc);

    expect(result).toEqual(sampleSettings);
  });

  it('should round-trip all theme variants', () => {
    for (const theme of ['light', 'dark', 'system'] as const) {
      const settings: UserSettings = { ...sampleSettings, theme };
      const doc = userSettingsToFirestoreDoc(settings);
      const result = firestoreDocToUserSettings(doc);
      expect(result.theme).toBe(theme);
    }
  });

  it('should round-trip all defaultAction variants', () => {
    for (const defaultAction of ['copy', 'paste'] as const) {
      const settings: UserSettings = { ...sampleSettings, defaultAction };
      const doc = userSettingsToFirestoreDoc(settings);
      const result = firestoreDocToUserSettings(doc);
      expect(result.defaultAction).toBe(defaultAction);
    }
  });

  it('should preserve all UserSettings fields through conversion', () => {
    fc.assert(
      fc.property(arbUserSettings, (settings) => {
        const doc = userSettingsToFirestoreDoc(settings);
        const result = firestoreDocToUserSettings(doc);
        expect(result).toEqual(settings);
      }),
      { numRuns: 100 },
    );
  });
});
