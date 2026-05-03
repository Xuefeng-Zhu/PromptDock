// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Folder, PromptRecipe } from '../../types/index';
import { useLibraryData } from '../use-library-data';

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

function makeFolder(overrides: Partial<Folder>): Folder {
  return {
    id: overrides.id ?? 'folder',
    name: overrides.name ?? 'Folder',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('useLibraryData', () => {
  it('derives folders, filtered prompts, counts, and selected prompt metadata', () => {
    const prompts = [
      makePrompt({
        id: 'selected',
        title: 'Selected',
        body: 'Hello {{name}} from {{place}}',
        folderId: 'folder-work',
        favorite: true,
        tags: ['writing'],
      }),
      makePrompt({
        id: 'derived-folder',
        title: 'Derived folder prompt',
        body: 'Summarize {{topic}}',
        folderId: 'folder-research',
        tags: ['research'],
      }),
      makePrompt({
        id: 'archived',
        title: 'Archived',
        folderId: 'folder-work',
        archived: true,
        archivedAt: new Date('2024-01-02'),
        tags: ['writing'],
      }),
    ];

    const { result } = renderHook(() =>
      useLibraryData({
        activeFilter: 'all',
        activeSidebarItem: 'folder-research',
        prompts,
        searchQuery: '',
        selectedPromptId: 'selected',
        userFolders: [makeFolder({ id: 'folder-work', name: 'Work' })],
        variableFillPromptId: 'derived-folder',
      }),
    );

    expect(result.current.derivedFolders.map((folder) => [folder.id, folder.name])).toEqual([
      ['folder-work', 'Work'],
      ['folder-research', 'Research'],
    ]);
    expect(result.current.filteredPrompts.map((prompt) => prompt.id)).toEqual(['derived-folder']);
    expect(result.current.promptCountByFolder).toEqual({
      'folder-work': 1,
      'folder-research': 1,
    });
    expect(result.current.selectedPrompt?.id).toBe('selected');
    expect(result.current.selectedPromptFolder?.name).toBe('Work');
    expect(result.current.selectedPromptVariables).toEqual(['name', 'place']);
    expect(result.current.variableFillPrompt?.id).toBe('derived-folder');
    expect(result.current.variableFillVariables).toEqual(['topic']);
    expect(result.current.sidebarFilterCounts.archived).toBe(1);
    expect(result.current.sidebarTagCounts).toEqual({ writing: 1, research: 1 });
    expect(result.current.availableTags).toEqual(['research', 'writing']);
  });
});
