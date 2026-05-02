// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHighlightedIndex } from '../use-highlighted-index';

describe('useHighlightedIndex', () => {
  it('moves within bounds and clamps at both ends', () => {
    const { result } = renderHook(() => useHighlightedIndex(3));

    act(() => result.current.moveHighlightedIndex(1));
    expect(result.current.highlightedIndex).toBe(1);

    act(() => result.current.moveHighlightedIndex(10));
    expect(result.current.highlightedIndex).toBe(2);

    act(() => result.current.moveHighlightedIndex(-10));
    expect(result.current.highlightedIndex).toBe(0);
  });

  it('clamps the current index when the list shrinks', () => {
    const { result, rerender } = renderHook(
      ({ listLength }) => useHighlightedIndex(listLength),
      { initialProps: { listLength: 4 } },
    );

    act(() => result.current.setHighlightedIndex(3));
    expect(result.current.highlightedIndex).toBe(3);

    rerender({ listLength: 2 });
    expect(result.current.highlightedIndex).toBe(1);

    rerender({ listLength: 0 });
    expect(result.current.highlightedIndex).toBe(0);
  });

  it('resets when the reset key changes', () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => useHighlightedIndex(4, resetKey),
      { initialProps: { resetKey: 'first' } },
    );

    act(() => result.current.setHighlightedIndex(3));
    expect(result.current.highlightedIndex).toBe(3);

    rerender({ resetKey: 'second' });
    expect(result.current.highlightedIndex).toBe(0);
  });
});
