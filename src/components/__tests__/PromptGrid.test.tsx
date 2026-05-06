// @vitest-environment jsdom
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PromptGrid } from '../library';
import { MOCK_PROMPTS } from '../../data/mock-data';
import type { PromptRecipe } from '../../types/index';

const defaultProps = {
  prompts: MOCK_PROMPTS,
  selectedPromptId: null,
  onSelectPrompt: vi.fn(),
  onToggleFavorite: vi.fn(),
  categoryColorMap: {} as Record<string, string>,
};

beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const height = this.getAttribute('role') === 'listbox' ? 720 : 200;
    return {
      bottom: height,
      height,
      left: 0,
      right: 1024,
      top: 0,
      width: 1024,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  };
});

function makePrompts(count: number): PromptRecipe[] {
  return Array.from({ length: count }, (_, index) => ({
    ...MOCK_PROMPTS[0],
    id: `prompt-${index}`,
    title: `Prompt ${index}`,
    tags: ['bulk', `tag-${index}`],
  }));
}

describe('PromptGrid', () => {
  it('renders prompt cards in a grid', () => {
    render(<PromptGrid {...defaultProps} />);
    const listbox = screen.getByRole('listbox', { name: 'Prompt list' });
    expect(listbox).toBeDefined();
    // All 6 mock prompts should render as options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(6);
  });

  it('keeps non-virtualized grid rows sized to the card content', () => {
    render(<PromptGrid {...defaultProps} prompts={[MOCK_PROMPTS[0]]} />);

    const listbox = screen.getByRole('listbox', { name: 'Prompt list' });

    expect(listbox.className).toContain('auto-rows-max');
    expect(listbox.className).toContain('content-start');
    expect(listbox.className).toContain('items-start');
  });

  it('renders each prompt title', () => {
    render(<PromptGrid {...defaultProps} />);
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText('Email Draft')).toBeDefined();
    expect(screen.getByText('Meeting Notes Extractor')).toBeDefined();
  });

  it('shows empty state when prompts array is empty', () => {
    render(<PromptGrid {...defaultProps} prompts={[]} />);
    expect(screen.getByText('No prompts found')).toBeDefined();
    expect(screen.getByText(/Try adjusting your search/)).toBeDefined();
  });

  it('does not show empty state when prompts exist', () => {
    render(<PromptGrid {...defaultProps} />);
    expect(screen.queryByText('No prompts found')).toBeNull();
  });

  it('virtualizes large prompt collections', async () => {
    const prompts = makePrompts(200);
    render(<PromptGrid {...defaultProps} prompts={prompts} />);

    const listbox = screen.getByRole('listbox', { name: 'Prompt list' });

    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    const options = screen.getAllByRole('option');

    expect(listbox.getAttribute('data-virtualized')).toBe('true');
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(prompts.length);
    expect(screen.getByText('Prompt 0')).toBeDefined();
    expect(screen.queryByText('Prompt 199')).toBeNull();
  });
});
