// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PromptFilters } from '../../utils/prompt-filters';
import { createDefaultPromptFilters } from '../../utils/prompt-filters';
import { usePromptFilterPopover } from '../use-prompt-filter-popover';

const folderOptions = [
  { label: 'Work', value: 'folder-work' },
  { label: 'Research', value: 'folder-research' },
];

const tagOptions = [
  { label: 'Writing', value: 'writing' },
  { label: 'Ops', value: 'ops' },
];

function setup(activeFilter: PromptFilters | 'all' = 'all') {
  const onFilterChange = vi.fn();
  const hook = renderHook(() =>
    usePromptFilterPopover({
      activeFilter,
      folderOptions,
      onFilterChange,
      tagOptions,
    }),
  );
  return { ...hook, onFilterChange };
}

describe('usePromptFilterPopover', () => {
  it('opens with applied filters and applies draft changes only on apply', () => {
    const { result, onFilterChange } = setup();

    act(() => {
      result.current.handleFilterButtonClick();
      result.current.updateDraftFilters({
        folders: ['folder-work'],
        lastUsed: 'last7Days',
        query: 'summary',
        statuses: ['favorites'],
        tags: ['writing'],
      });
    });

    expect(result.current.filterPopoverOpen).toBe(true);
    expect(result.current.draftFilterChips.map((chip) => chip.label)).toEqual([
      'Search: summary',
      'Status: Favorites only',
      'Folder: Work',
      '#writing',
      'Last used: Last 7 days',
    ]);
    expect(onFilterChange).not.toHaveBeenCalled();

    act(() => {
      result.current.applyDraftFilters();
    });

    expect(onFilterChange).toHaveBeenCalledWith({
      ...createDefaultPromptFilters(),
      folders: ['folder-work'],
      lastUsed: 'last7Days',
      query: 'summary',
      statuses: ['favorites'],
      tags: ['writing'],
    });
    expect(result.current.filterPopoverOpen).toBe(false);
  });

  it('removes individual chips and resets draft filters', () => {
    const initialFilter: PromptFilters = {
      ...createDefaultPromptFilters(),
      folders: ['folder-work'],
      lastUsed: 'today',
      query: 'ops',
      statuses: ['hasVariables'],
      tags: ['ops'],
    };
    const { result } = setup(initialFilter);

    act(() => {
      result.current.handleFilterButtonClick();
    });

    const statusChip = result.current.draftFilterChips.find((chip) => chip.kind === 'status');
    expect(statusChip).toBeDefined();

    act(() => {
      result.current.removeFilterChip(statusChip!);
    });

    expect(result.current.draftFilters.statuses).toEqual([]);
    expect(result.current.draftFilters.query).toBe('ops');

    act(() => {
      result.current.resetDraftFilters();
    });

    expect(result.current.draftFilters).toEqual(createDefaultPromptFilters());
  });

  it('closes on Escape and restores draft filters from applied state', () => {
    const initialFilter: PromptFilters = {
      ...createDefaultPromptFilters(),
      statuses: ['recent'],
    };
    const { result } = setup(initialFilter);

    act(() => {
      result.current.handleFilterButtonClick();
      result.current.updateDraftFilters({ query: 'temporary' });
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.filterPopoverOpen).toBe(false);
    expect(result.current.draftFilters).toEqual(initialFilter);
  });
});
