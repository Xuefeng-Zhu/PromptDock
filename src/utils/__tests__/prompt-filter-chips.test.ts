import { describe, expect, it } from 'vitest';
import { createDefaultPromptFilters, type PromptFilters } from '../prompt-filters';
import {
  getActiveFilterChips,
  removeFilterChipFromFilters,
  toggleFilterValue,
} from '../prompt-filter-chips';

describe('prompt filter chips', () => {
  it('toggles selected values without mutating the original array', () => {
    const original = ['favorites'];

    expect(toggleFilterValue(original, 'recent')).toEqual(['favorites', 'recent']);
    expect(toggleFilterValue(original, 'favorites')).toEqual([]);
    expect(original).toEqual(['favorites']);
  });

  it('derives chips with human labels and fallback folder names', () => {
    const filters: PromptFilters = {
      ...createDefaultPromptFilters(),
      folders: ['folder-work', 'folder-long_term-research-1777560341621'],
      lastUsed: 'last30Days',
      query: 'draft',
      statuses: ['favorites', 'hasVariables'],
      tags: ['writing'],
    };

    const chips = getActiveFilterChips(
      filters,
      { 'folder-work': 'Work' },
      { writing: 'Writing' },
    );

    expect(chips.map((chip) => chip.label)).toEqual([
      'Search: draft',
      'Status: Favorites only',
      'Status: Has variables',
      'Folder: Work',
      'Folder: Long Term Research',
      '#writing',
      'Last used: Last 30 days',
    ]);
  });

  it('removes each chip kind from filters while preserving unrelated fields', () => {
    const filters: PromptFilters = {
      ...createDefaultPromptFilters(),
      folders: ['folder-work'],
      lastUsed: 'today',
      query: 'draft',
      statuses: ['favorites'],
      tags: ['writing'],
    };

    expect(
      removeFilterChipFromFilters(filters, { id: 'query', label: 'Search: draft', kind: 'query' }),
    ).toEqual({ ...filters, query: '' });

    expect(
      removeFilterChipFromFilters(filters, {
        id: 'status-favorites',
        label: 'Status: Favorites only',
        kind: 'status',
        value: 'favorites',
      }),
    ).toEqual({ ...filters, statuses: [] });

    expect(
      removeFilterChipFromFilters(filters, {
        id: 'folder-work',
        label: 'Folder: Work',
        kind: 'folder',
        value: 'folder-work',
      }),
    ).toEqual({ ...filters, folders: [] });

    expect(
      removeFilterChipFromFilters(filters, {
        id: 'tag-writing',
        label: '#writing',
        kind: 'tag',
        value: 'writing',
      }),
    ).toEqual({ ...filters, tags: [] });

    expect(
      removeFilterChipFromFilters(filters, {
        id: 'last-used',
        label: 'Last used: Today',
        kind: 'lastUsed',
      }),
    ).toEqual({ ...filters, lastUsed: 'any' });
  });
});
