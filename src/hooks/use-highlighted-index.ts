import { useCallback, useEffect, useState } from 'react';
import { clampIndex } from '../utils/list-navigation';

export function useHighlightedIndex(listLength: number, resetKey?: unknown) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const resetHighlightedIndex = useCallback(() => {
    setHighlightedIndex(0);
  }, []);

  const moveHighlightedIndex = useCallback(
    (delta: number) => {
      setHighlightedIndex((current) => clampIndex(current, delta, listLength));
    },
    [listLength],
  );

  useEffect(() => {
    setHighlightedIndex((current) => clampIndex(current, 0, listLength));
  }, [listLength]);

  useEffect(() => {
    if (resetKey !== undefined) {
      setHighlightedIndex(0);
    }
  }, [resetKey]);

  return {
    highlightedIndex,
    moveHighlightedIndex,
    resetHighlightedIndex,
    setHighlightedIndex,
  };
}
