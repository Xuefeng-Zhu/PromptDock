// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickLauncherResults } from '../quick-launcher/QuickLauncherResults';
import type { PromptRecipe } from '../../types/index';

function makePrompt(index: number): PromptRecipe {
  return {
    id: `prompt-${index}`,
    workspaceId: 'local',
    title: `Prompt ${index}`,
    description: `Description ${index}`,
    body: `Body ${index}`,
    tags: ['bulk', `tag-${index}`],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  };
}

function renderResults(overrides: Partial<Parameters<typeof QuickLauncherResults>[0]> = {}) {
  const prompts = Array.from({ length: 160 }, (_, index) => makePrompt(index));

  return render(
    <QuickLauncherResults
      highlightIndex={0}
      isLoading={false}
      prompts={prompts}
      query=""
      results={prompts}
      onHighlightPrompt={vi.fn()}
      onSelectPrompt={vi.fn()}
      {...overrides}
    />,
  );
}

describe('QuickLauncherResults', () => {
  it('virtualizes large result sets', () => {
    renderResults();

    const listbox = screen.getByRole('listbox', { name: 'Search results' });
    const options = screen.getAllByRole('option');

    expect(listbox.getAttribute('data-virtualized')).toBe('true');
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(160);
    expect(screen.getByText('Prompt 0')).toBeDefined();
    expect(screen.queryByText('Prompt 159')).toBeNull();
  });

  it('scrolls the virtualized window to the highlighted result', async () => {
    renderResults({ highlightIndex: 120 });

    const listbox = screen.getByRole('listbox', { name: 'Search results' });

    await waitFor(() => {
      expect(listbox.scrollTop).toBeGreaterThan(0);
    });
  });
});
