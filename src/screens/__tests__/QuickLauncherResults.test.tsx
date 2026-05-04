// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { QuickLauncherResults } from '../quick-launcher/QuickLauncherResults';
import type { PromptRecipe } from '../../types/index';

beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const height = this.getAttribute('role') === 'listbox' ? 480 : 76;
    return {
      bottom: height,
      height,
      left: 0,
      right: 640,
      top: 0,
      width: 640,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  };

  HTMLElement.prototype.scrollTo = function scrollTo(
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    if (typeof options === 'number') {
      this.scrollLeft = options;
      this.scrollTop = y ?? 0;
      return;
    }

    this.scrollLeft = options?.left ?? this.scrollLeft;
    this.scrollTop = options?.top ?? this.scrollTop;
  };
});

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
  it('virtualizes large result sets', async () => {
    renderResults();

    const listbox = screen.getByRole('listbox', { name: 'Search results' });

    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    const options = screen.getAllByRole('option');

    expect(listbox.getAttribute('data-virtualized')).toBe('true');
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(160);
    expect(screen.getByText('Prompt 0')).toBeDefined();
    expect(screen.queryByText('Prompt 159')).toBeNull();
  });

  it('preserves highlighted result semantics in the virtualized window', async () => {
    renderResults({ highlightIndex: 0 });

    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true');
  });
});
