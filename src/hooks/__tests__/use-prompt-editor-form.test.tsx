// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Folder, PromptRecipe } from '../../types/index';
import { usePromptEditorForm } from '../use-prompt-editor-form';

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Original title',
    description: 'Original description',
    body: 'Hello {{name}}',
    tags: ['alpha'],
    folderId: 'folder-work',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

const folders: Folder[] = [
  {
    id: 'folder-work',
    name: 'Work',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
];

describe('usePromptEditorForm', () => {
  it('validates required title and body before saving', async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      usePromptEditorForm({ folders, onSave }),
    );

    await act(async () => {
      await result.current.savePrompt();
    });

    expect(result.current.validationError).toBe('Title is required.');
    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      result.current.setTitle('Ready');
    });

    await act(async () => {
      await result.current.savePrompt();
    });

    expect(result.current.validationError).toBe('Body is required.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('reports dirty state for field and pending tag changes, then clears on unmount', () => {
    const onDirtyChange = vi.fn();
    const onSave = vi.fn();
    const prompt = makePrompt();
    const { result, unmount } = renderHook(() =>
      usePromptEditorForm({
        folders,
        onDirtyChange,
        onSave,
        prompt,
        promptId: 'prompt-1',
      }),
    );

    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    act(() => {
      result.current.setTitle('Changed title');
    });

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    act(() => {
      result.current.setTitle('Original title');
      result.current.setTagInput('draft-tag');
    });

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    unmount();

    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('saves normalized prompt data and supports tag editing', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const prompt = makePrompt();
    const { result } = renderHook(() =>
      usePromptEditorForm({
        folders,
        onSave,
        prompt,
        promptId: 'prompt-1',
      }),
    );

    act(() => {
      result.current.setTitle('  New title  ');
      result.current.setDescription('  New description  ');
      result.current.setTagInput('beta');
    });

    act(() => {
      result.current.handleAddTag();
      result.current.setFavorite(true);
      result.current.setFolderId(null);
    });

    await act(async () => {
      await result.current.savePrompt();
    });

    expect(onSave).toHaveBeenCalledWith({
      title: 'New title',
      description: 'New description',
      body: 'Hello {{name}}',
      tags: ['alpha', 'beta'],
      folderId: null,
      favorite: true,
    });
  });

  it('adds matching existing tags without creating case variants', () => {
    const onSave = vi.fn();
    const prompt = makePrompt();
    const { result } = renderHook(() =>
      usePromptEditorForm({
        availableTags: ['Beta'],
        folders,
        onSave,
        prompt,
        promptId: 'prompt-1',
      }),
    );

    act(() => {
      result.current.setTagInput('beta');
    });

    act(() => {
      result.current.handleAddTag();
    });

    expect(result.current.tags).toEqual(['alpha', 'Beta']);

    act(() => {
      result.current.setTagInput('BETA');
    });

    act(() => {
      result.current.handleAddTag();
    });

    expect(result.current.tags).toEqual(['alpha', 'Beta']);
  });

  it('renders and resets live preview variable values', () => {
    const onSave = vi.fn();
    const prompt = makePrompt();
    const { result } = renderHook(() =>
      usePromptEditorForm({
        folders,
        onSave,
        prompt,
        promptId: 'prompt-1',
      }),
    );

    expect(result.current.variables).toEqual(['name']);
    expect(result.current.renderedPreview).toBe('Hello {{name}}');

    act(() => {
      result.current.handleVariableValueChange('name', 'Ada');
    });

    expect(result.current.renderedPreview).toBe('Hello Ada');

    act(() => {
      result.current.handleResetPreview();
    });

    expect(result.current.renderedPreview).toBe('Hello {{name}}');
  });
});
