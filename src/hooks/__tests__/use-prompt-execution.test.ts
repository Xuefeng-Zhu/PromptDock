// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import { usePromptExecution } from '../use-prompt-execution';

const mockCopyToClipboard = vi.fn();
const mockPasteToActiveApp = vi.fn();
const mockTrackPromptAction = vi.fn();

vi.mock('../../utils/clipboard', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
  pasteToActiveApp: (...args: unknown[]) => mockPasteToActiveApp(...args),
}));

vi.mock('../../services/analytics-service', () => ({
  trackPromptAction: (...args: unknown[]) => mockTrackPromptAction(...args),
}));

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'local',
    title: 'Prompt',
    description: '',
    body: 'Hello world',
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

describe('usePromptExecution', () => {
  beforeEach(() => {
    mockCopyToClipboard.mockResolvedValue(undefined);
    mockPasteToActiveApp.mockResolvedValue({ pasted: true });
    mockTrackPromptAction.mockClear();
  });

  it('copies text, marks the prompt as used, and tracks analytics', async () => {
    const markPromptUsed = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePromptExecution({ defaultAction: 'copy', markPromptUsed }),
    );

    await act(async () => {
      await expect(
        result.current.copyText({
          text: 'Copied text',
          promptId: 'prompt-1',
          source: 'command_palette',
        }),
      ).resolves.toEqual({
        action: 'copied',
        message: 'Prompt copied to clipboard',
      });
    });

    expect(mockCopyToClipboard).toHaveBeenCalledWith('Copied text');
    expect(markPromptUsed).toHaveBeenCalledWith('prompt-1');
    expect(mockTrackPromptAction).toHaveBeenCalledWith('copied', {
      source: 'command_palette',
    });
  });

  it('uses the default paste action for prompts and preserves beforePaste behavior', async () => {
    const beforePaste = vi.fn().mockResolvedValue(undefined);
    const markPromptUsed = vi.fn().mockResolvedValue(undefined);
    mockPasteToActiveApp.mockImplementation(async (_text: string, callback?: () => Promise<void>) => {
      await callback?.();
      return { pasted: true };
    });

    const { result } = renderHook(() =>
      usePromptExecution({
        beforePaste,
        defaultAction: 'paste',
        markPromptUsed,
      }),
    );

    await act(async () => {
      await expect(
        result.current.executePrompt(makePrompt({ body: 'Prompt body' }), {
          source: 'quick_launcher',
        }),
      ).resolves.toEqual({
        action: 'pasted',
        message: 'Prompt pasted',
      });
    });

    expect(mockPasteToActiveApp).toHaveBeenCalledWith('Prompt body', beforePaste);
    expect(beforePaste).toHaveBeenCalledTimes(1);
    expect(markPromptUsed).toHaveBeenCalledWith('prompt-1');
    expect(mockTrackPromptAction).toHaveBeenCalledWith('pasted', {
      source: 'quick_launcher',
    });
  });

  it('reports a copy result when paste falls back to clipboard only', async () => {
    const markPromptUsed = vi.fn().mockResolvedValue(undefined);
    mockPasteToActiveApp.mockResolvedValue({ pasted: false });
    const { result } = renderHook(() =>
      usePromptExecution({ defaultAction: 'paste', markPromptUsed }),
    );

    await act(async () => {
      await expect(
        result.current.executeText({
          action: 'paste',
          text: 'Fallback text',
          source: 'variable_fill',
        }),
      ).resolves.toEqual({
        action: 'copied',
        message: 'Prompt copied to clipboard',
      });
    });

    expect(mockTrackPromptAction).toHaveBeenCalledWith('copied', {
      source: 'variable_fill',
    });
    expect(markPromptUsed).not.toHaveBeenCalled();
  });
});
