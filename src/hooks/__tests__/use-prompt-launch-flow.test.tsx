// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePromptLaunchFlow } from '../app-shell/use-prompt-launch-flow';
import type { PromptExecutionResult } from '../use-prompt-execution';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('usePromptLaunchFlow', () => {
  it('does not close a newer variable-fill modal when an older copy resolves late', async () => {
    const copyResult = deferred<{ action: 'copied'; message: string }>();
    let activePromptId: string | null = 'prompt-next';
    const setVariableFillPromptId = vi.fn((next) => {
      activePromptId = typeof next === 'function' ? next(activePromptId) : next;
    });

    const { result } = renderHook(() =>
      usePromptLaunchFlow({
        addToast: vi.fn(),
        copyText: vi.fn(() => copyResult.promise),
        defaultAction: 'copy',
        executePrompt: vi.fn(),
        pasteText: vi.fn(),
        setCommandPaletteOpen: vi.fn(),
        setVariableFillPromptId,
        variableFillPromptId: 'prompt-original',
      }),
    );

    const copyPromise = result.current.handleVariableFillCopy('Rendered text');
    copyResult.resolve({ action: 'copied', message: 'Prompt copied' });

    await act(async () => {
      await copyPromise;
    });

    expect(activePromptId).toBe('prompt-next');
  });

  it('closes the active variable-fill modal when the matching copy resolves', async () => {
    let activePromptId: string | null = 'prompt-original';
    const setVariableFillPromptId = vi.fn((next) => {
      activePromptId = typeof next === 'function' ? next(activePromptId) : next;
    });

    const { result } = renderHook(() =>
      usePromptLaunchFlow({
        addToast: vi.fn(),
        copyText: vi.fn(
          async (): Promise<PromptExecutionResult> => ({
            action: 'copied',
            message: 'Prompt copied',
          }),
        ),
        defaultAction: 'copy',
        executePrompt: vi.fn(),
        pasteText: vi.fn(),
        setCommandPaletteOpen: vi.fn(),
        setVariableFillPromptId,
        variableFillPromptId: 'prompt-original',
      }),
    );

    await act(async () => {
      await result.current.handleVariableFillCopy('Rendered text');
    });

    expect(activePromptId).toBeNull();
  });
});
