// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptInspectorHeader } from '../PromptInspectorHeader';
import type { PromptRecipe } from '../../../types/index';

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello world',
    tags: [],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

describe('PromptInspectorHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows archive for active prompts', () => {
    render(<PromptInspectorHeader prompt={makePrompt()} onArchive={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));

    expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeDefined();
    expect(screen.queryByRole('menuitem', { name: 'Restore' })).toBeNull();
  });

  it('shows restore for archived prompts', () => {
    const onRestore = vi.fn();
    render(
      <PromptInspectorHeader
        prompt={makePrompt({ archived: true, archivedAt: new Date('2024-02-01') })}
        onArchive={vi.fn()}
        onRestore={onRestore}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Restore' }));

    expect(onRestore).toHaveBeenCalledWith('prompt-1');
    expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
  });

  it('does not delete when confirmation is cancelled', () => {
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PromptInspectorHeader prompt={makePrompt()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Test Prompt'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes after confirmation', () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PromptInspectorHeader prompt={makePrompt()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith('prompt-1');
  });
});
