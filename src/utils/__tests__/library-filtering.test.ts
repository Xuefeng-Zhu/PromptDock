import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import type { PromptFilters } from '../prompt-filters';
import { filterPrompts } from '../library-filtering';

function makePrompt(overrides: Partial<PromptRecipe>): PromptRecipe {
  return {
    id: overrides.id ?? 'prompt',
    workspaceId: 'local',
    title: 'Prompt',
    description: '',
    body: 'Body',
    tags: [],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function ids(prompts: PromptRecipe[]): string[] {
  return prompts.map((prompt) => prompt.id);
}

describe('filterPrompts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const prompts = [
    makePrompt({
      id: 'alpha',
      title: 'Alpha summary',
      description: 'Draft outreach note',
      tags: ['writing'],
      folderId: 'folder-work',
      favorite: true,
      updatedAt: new Date('2024-01-10T00:00:00.000Z'),
      lastUsedAt: new Date('2024-01-15T11:00:00.000Z'),
    }),
    makePrompt({
      id: 'beta',
      title: 'Beta plan',
      description: 'Research agenda',
      body: 'Plan with {{topic}}',
      tags: ['research'],
      folderId: 'folder-research',
      updatedAt: new Date('2024-01-09T00:00:00.000Z'),
      lastUsedAt: new Date('2024-01-12T12:00:00.000Z'),
    }),
    makePrompt({
      id: 'gamma',
      title: 'Gamma archived',
      description: 'Old writing prompt',
      tags: ['writing'],
      folderId: 'folder-work',
      archived: true,
      archivedAt: new Date('2024-01-12T00:00:00.000Z'),
      updatedAt: new Date('2024-01-08T00:00:00.000Z'),
      lastUsedAt: new Date('2024-01-14T12:00:00.000Z'),
    }),
    makePrompt({
      id: 'delta',
      title: 'Delta brief',
      description: 'Operations note',
      tags: ['ops'],
      folderId: 'folder-work',
      updatedAt: new Date('2024-01-07T00:00:00.000Z'),
      lastUsedAt: new Date('2023-12-01T12:00:00.000Z'),
    }),
  ];

  it('shows active prompts for the library and archived prompts for the archive', () => {
    expect(ids(filterPrompts(prompts, '', 'all', 'library'))).toEqual([
      'alpha',
      'beta',
      'delta',
    ]);
    expect(ids(filterPrompts(prompts, '', 'all', 'archived'))).toEqual(['gamma']);
  });

  it('applies sidebar favorites, recent, tag, and folder filters before menu filters', () => {
    expect(ids(filterPrompts(prompts, '', 'all', 'favorites'))).toEqual(['alpha']);
    expect(ids(filterPrompts(prompts, '', 'all', 'recent'))).toEqual(['alpha', 'beta']);
    expect(ids(filterPrompts(prompts, '', 'all', 'tag-writing'))).toEqual(['alpha']);
    expect(ids(filterPrompts(prompts, '', 'all', 'folder-work'))).toEqual(['alpha', 'delta']);
  });

  it('searches active prompts by title, description, and tags', () => {
    expect(ids(filterPrompts(prompts, 'research', 'all', 'library'))).toEqual(['beta']);
    expect(ids(filterPrompts(prompts, 'writing', 'all', 'library'))).toEqual(['alpha']);
  });

  it('combines advanced filters with archived visibility', () => {
    const filter: PromptFilters = {
      sortBy: 'updated',
      query: '',
      statuses: ['archived'],
      folders: ['folder-work'],
      tags: ['writing'],
      lastUsed: 'any',
    };

    expect(ids(filterPrompts(prompts, '', filter, 'library'))).toEqual(['gamma']);
  });
});
