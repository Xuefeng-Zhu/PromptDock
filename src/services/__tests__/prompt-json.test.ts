import { describe, expect, it } from 'vitest';
import { parsePromptJson } from '../prompt-json';
import type { Folder } from '../../types/index';

const folders: Folder[] = [
  {
    id: 'folder-writing',
    name: 'Writing',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
];

describe('parsePromptJson', () => {
  it('accepts a minimal prompt JSON object', () => {
    const result = parsePromptJson(JSON.stringify({
      title: 'Launch plan',
      body: 'Write a plan for {{topic}}.',
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual({
      title: 'Launch plan',
      description: '',
      body: 'Write a plan for {{topic}}.',
      tags: [],
      folderId: null,
      favorite: false,
    });
  });

  it('maps optional metadata without accepting app-owned fields', () => {
    const result = parsePromptJson(
      JSON.stringify({
        id: 'external-id',
        workspaceId: 'external-workspace',
        title: '  Release notes  ',
        description: '  Draft for product updates  ',
        body: 'Summarize {{changes}}.',
        tags: ['writing', 'Writing', ' product '],
        folder: 'writing',
        favorite: true,
        version: 99,
      }),
      { folders },
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual({
      title: 'Release notes',
      description: 'Draft for product updates',
      body: 'Summarize {{changes}}.',
      tags: ['writing', 'product'],
      folderId: 'folder-writing',
      favorite: true,
    });
  });

  it('returns a parse error for invalid JSON', () => {
    const result = parsePromptJson('{nope');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('Invalid JSON: unable to parse input.');
    }
  });

  it('returns field errors when required fields are missing', () => {
    const result = parsePromptJson(JSON.stringify({ tags: ['draft'] }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('title is required and must be a non-empty string.');
      expect(result.errors).toContain('body is required and must be a non-empty string.');
    }
  });

  it('returns field errors for invalid optional metadata', () => {
    const result = parsePromptJson(JSON.stringify({
      title: 'Bad metadata',
      body: 'Body',
      description: 123,
      tags: ['ok', false],
      favorite: 'yes',
      folder: 'Unknown',
    }), { folders });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('description must be a string.');
      expect(result.errors).toContain('tags must be an array of strings.');
      expect(result.errors).toContain('favorite must be a boolean.');
      expect(result.errors).toContain('folder must match an existing folder name or id.');
    }
  });
});
