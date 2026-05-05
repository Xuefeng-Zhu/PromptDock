import { describe, expect, it } from 'vitest';
import {
  getQuickTagOptions,
  normalizeTag,
  resolveExistingTagName,
} from '../tag-options';

describe('tag options', () => {
  it('normalizes tags for case-insensitive comparison', () => {
    expect(normalizeTag('  Client Work  ')).toBe('client work');
  });

  it('filters, trims, de-duplicates, and excludes selected tags', () => {
    const options = getQuickTagOptions({
      availableTags: [
        ' Writing ',
        'writing',
        'Research',
        '',
        'Client Work',
        'client ops',
      ],
      selectedTags: ['research'],
      query: 'cli',
    });

    expect(options).toEqual(['Client Work', 'client ops']);
  });

  it('returns the first unique quick options up to the limit', () => {
    const options = getQuickTagOptions({
      availableTags: ['one', 'two', 'three', 'four'],
      selectedTags: [],
      query: '',
      limit: 3,
    });

    expect(options).toEqual(['one', 'two', 'three']);
  });

  it('resolves an entered tag to an existing tag name while preserving casing', () => {
    expect(resolveExistingTagName(['Product', ' Client Work '], 'client work')).toBe('Client Work');
    expect(resolveExistingTagName(['Product'], '  New Tag  ')).toBe('New Tag');
  });
});
