import { describe, it, expect } from 'vitest';
import {
  MOCK_PROMPTS,
  MOCK_FOLDERS,
  PROMPT_CATEGORY_MAP,
  CATEGORY_COLORS,
} from '../mock-data';

/**
 * Unit tests for the mock data module.
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('Mock Data Module', () => {
  // Test 1: MOCK_PROMPTS contains exactly 6 prompts
  it('MOCK_PROMPTS contains exactly 6 prompts', () => {
    expect(MOCK_PROMPTS).toHaveLength(6);
  });

  // Test 2: MOCK_FOLDERS contains exactly 4 folders
  it('MOCK_FOLDERS contains exactly 4 folders', () => {
    expect(MOCK_FOLDERS).toHaveLength(4);
  });

  // Test 3: All prompts have required fields
  it('all prompts have required fields', () => {
    const requiredFields = [
      'id',
      'workspaceId',
      'title',
      'description',
      'body',
      'tags',
      'folderId',
      'favorite',
      'archived',
      'createdAt',
      'updatedAt',
      'createdBy',
      'version',
    ] as const;

    for (const prompt of MOCK_PROMPTS) {
      for (const field of requiredFields) {
        expect(prompt).toHaveProperty(field);
      }
      // Validate types of key fields
      expect(typeof prompt.id).toBe('string');
      expect(typeof prompt.title).toBe('string');
      expect(typeof prompt.body).toBe('string');
      expect(Array.isArray(prompt.tags)).toBe(true);
      expect(typeof prompt.favorite).toBe('boolean');
      expect(typeof prompt.archived).toBe('boolean');
      expect(typeof prompt.version).toBe('number');
      expect(prompt.createdAt).toBeInstanceOf(Date);
      expect(prompt.updatedAt).toBeInstanceOf(Date);
    }
  });

  // Test 4: All prompt bodies contain at least one {{variable_name}} placeholder
  it('all prompt bodies contain at least one {{variable_name}} placeholder', () => {
    const variablePattern = /\{\{[a-z_]+\}\}/;
    for (const prompt of MOCK_PROMPTS) {
      expect(prompt.body).toMatch(variablePattern);
    }
  });

  // Test 5: PROMPT_CATEGORY_MAP covers all 6 prompt IDs
  it('PROMPT_CATEGORY_MAP covers all 6 prompt IDs', () => {
    const promptIds = MOCK_PROMPTS.map((p) => p.id);
    const mappedIds = Object.keys(PROMPT_CATEGORY_MAP);

    expect(mappedIds).toHaveLength(6);
    for (const id of promptIds) {
      expect(PROMPT_CATEGORY_MAP).toHaveProperty(id);
    }
  });

  // Test 6: CATEGORY_COLORS has entries for all 6 categories
  it('CATEGORY_COLORS has entries for all 6 categories', () => {
    const categoryKeys = Object.keys(CATEGORY_COLORS);
    expect(categoryKeys).toHaveLength(6);

    // Every category referenced by PROMPT_CATEGORY_MAP exists in CATEGORY_COLORS
    const referencedCategories = Object.values(PROMPT_CATEGORY_MAP);
    for (const category of referencedCategories) {
      expect(CATEGORY_COLORS).toHaveProperty(category);
      const entry = CATEGORY_COLORS[category];
      expect(entry).toHaveProperty('bg');
      expect(entry).toHaveProperty('text');
      expect(entry).toHaveProperty('icon');
    }
  });

  // Test 7: All folder IDs referenced by prompts exist in MOCK_FOLDERS
  it('all folder IDs referenced by prompts exist in MOCK_FOLDERS', () => {
    const folderIds = new Set(MOCK_FOLDERS.map((f) => f.id));

    for (const prompt of MOCK_PROMPTS) {
      if (prompt.folderId !== null) {
        expect(folderIds.has(prompt.folderId)).toBe(true);
      }
    }
  });
});
