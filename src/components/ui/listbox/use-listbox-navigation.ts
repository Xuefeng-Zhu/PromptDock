import { useCallback, useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';

interface UseListboxNavigationOptions {
  onSelect: (index: number) => void;
  open: boolean;
  optionCount: number;
  selectedIndex: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function useListboxNavigation({
  onSelect,
  open,
  optionCount,
  selectedIndex,
  setOpen,
}: UseListboxNavigationOptions) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open || !listRef.current || highlightedIndex < 0) return;
    const items = listRef.current.children;
    if (items[highlightedIndex]) {
      (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const openListbox = useCallback(() => {
    setOpen(true);
    setHighlightedIndex(selectedIndex);
  }, [selectedIndex, setOpen]);

  const toggleListbox = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    openListbox();
  }, [open, openListbox, setOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          openListbox();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => Math.min(prev + 1, optionCount - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < optionCount) {
            onSelect(highlightedIndex);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setOpen(false);
          break;
      }
    },
    [highlightedIndex, onSelect, open, openListbox, optionCount, setOpen],
  );

  return {
    handleKeyDown,
    highlightedIndex,
    listRef,
    openListbox,
    setHighlightedIndex,
    toggleListbox,
  };
}
