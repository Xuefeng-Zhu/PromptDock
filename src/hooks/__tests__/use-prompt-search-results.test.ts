// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import {
  searchPromptResults,
  usePromptSearchResults,
} from '../use-prompt-search-results';

function makePrompt(overrides: Partial<PromptRecipe>): PromptRecipe {
  return {
    id: overrides.id ?? 'prompt',
    workspaceId: 'local',
    title: 'Prompt',
    description: '',
    body: '',
    tags: [],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function ids(prompts: PromptRecipe[]): string[] {
  return prompts.map((prompt) => prompt.id);
}

const prompts = [
  makePrompt({ id: 'title', title: 'Budget template' }),
  makePrompt({ id: 'tag', title: 'Finance note', tags: ['budget'] }),
  makePrompt({ id: 'body', title: 'Draft', body: 'Budget details live here' }),
  makePrompt({ id: 'archived', title: 'Budget archive', archived: true }),
];

describe('usePromptSearchResults', () => {
  it('searches prompt fields with ranking and excludes archived prompts by default', () => {
    expect(ids(searchPromptResults(prompts, 'budget'))).toEqual(['title', 'tag', 'body']);
  });

  it('supports archived and field-scoped searches', () => {
    expect(
      ids(searchPromptResults(prompts, 'budget', {
        includeArchived: true,
        fields: ['title'],
      })),
    ).toEqual(['title', 'archived']);
  });

  it('updates hook results when the query changes', () => {
    const { result, rerender } = renderHook(
      ({ query }) => usePromptSearchResults(prompts, query),
      { initialProps: { query: 'finance' } },
    );

    expect(ids(result.current)).toEqual(['tag']);

    rerender({ query: 'details' });
    expect(ids(result.current)).toEqual(['body']);
  });
});
