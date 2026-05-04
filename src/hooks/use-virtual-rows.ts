import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

export interface VirtualRow {
  index: number;
  size: number;
  start: number;
}

interface UseVirtualRowsOptions {
  enabled: boolean;
  estimatedViewportHeight?: number;
  overscan?: number;
  rowCount: number;
  rowGap?: number;
  rowHeight: number;
  scrollElement?: 'nearest' | 'self';
}

interface VirtualRange {
  end: number;
  start: number;
}

const DEFAULT_ESTIMATED_VIEWPORT_HEIGHT = 720;
const DEFAULT_OVERSCAN_ROWS = 4;

function getVisibleRowLimit(
  rowCount: number,
  rowHeight: number,
  rowGap: number,
  estimatedViewportHeight: number,
  overscan: number,
): number {
  const stride = rowHeight + rowGap;
  return Math.min(rowCount, Math.ceil(estimatedViewportHeight / stride) + overscan);
}

function isWindowScrollContainer(scrollContainer: HTMLElement | Window): scrollContainer is Window {
  return scrollContainer === window;
}

function getScrollableAncestor(
  element: HTMLElement,
  scrollElement: 'nearest' | 'self',
): HTMLElement | Window {
  if (scrollElement === 'self') return element;

  let current: HTMLElement | null = element;

  while (current) {
    const overflowY = window.getComputedStyle(current).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current;
    }
    current = current.parentElement;
  }

  return window;
}

function getElementViewportHeight(
  scrollContainer: HTMLElement | Window,
  estimatedViewportHeight: number,
): number {
  if (isWindowScrollContainer(scrollContainer)) {
    return window.innerHeight || estimatedViewportHeight;
  }

  return scrollContainer.clientHeight || estimatedViewportHeight;
}

function getOffsetTopWithin(element: HTMLElement, ancestor: HTMLElement): number {
  let offset = 0;
  let current: HTMLElement | null = element;

  while (current && current !== ancestor) {
    offset += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return offset;
}

function getVisibleStart(scrollContainer: HTMLElement | Window, element: HTMLElement): number {
  if (scrollContainer === element) {
    return element.scrollTop;
  }

  if (isWindowScrollContainer(scrollContainer)) {
    const rect = element.getBoundingClientRect();
    return Math.max(0, -rect.top);
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const rectStart = containerRect.top - elementRect.top;

  if (rectStart !== 0) {
    return Math.max(0, rectStart);
  }

  return Math.max(0, scrollContainer.scrollTop - getOffsetTopWithin(element, scrollContainer));
}

function rangesAreEqual(a: VirtualRange, b: VirtualRange): boolean {
  return a.start === b.start && a.end === b.end;
}

export function useVirtualRows<TElement extends HTMLElement = HTMLElement>({
  enabled,
  estimatedViewportHeight = DEFAULT_ESTIMATED_VIEWPORT_HEIGHT,
  overscan = DEFAULT_OVERSCAN_ROWS,
  rowCount,
  rowGap = 0,
  rowHeight,
  scrollElement = 'nearest',
}: UseVirtualRowsOptions): {
  containerRef: RefObject<TElement>;
  scrollToRow: (rowIndex: number) => void;
  shouldVirtualize: boolean;
  totalSize: number;
  virtualRows: VirtualRow[];
} {
  const containerRef = useRef<TElement>(null);
  const stride = rowHeight + rowGap;
  const initialEnd = getVisibleRowLimit(
    rowCount,
    rowHeight,
    rowGap,
    estimatedViewportHeight,
    overscan,
  );
  const [range, setRange] = useState<VirtualRange>({ start: 0, end: initialEnd });

  const totalSize = rowCount === 0 ? 0 : rowCount * rowHeight + (rowCount - 1) * rowGap;

  const updateRange = useCallback(() => {
    if (!enabled) {
      const nextRange = { start: 0, end: rowCount };
      setRange((current) => (rangesAreEqual(current, nextRange) ? current : nextRange));
      return;
    }

    const element = containerRef.current;
    if (!element) {
      const nextRange = {
        start: 0,
        end: getVisibleRowLimit(
          rowCount,
          rowHeight,
          rowGap,
          estimatedViewportHeight,
          overscan,
        ),
      };
      setRange((current) => (rangesAreEqual(current, nextRange) ? current : nextRange));
      return;
    }

    const scrollContainer = getScrollableAncestor(element, scrollElement);
    const viewportHeight = getElementViewportHeight(scrollContainer, estimatedViewportHeight);
    const visibleStart = getVisibleStart(scrollContainer, element);
    const visibleEnd = visibleStart + viewportHeight;

    const nextRange = {
      start: Math.max(0, Math.floor(visibleStart / stride) - overscan),
      end: Math.min(rowCount, Math.ceil(visibleEnd / stride) + overscan),
    };

    setRange((current) => (rangesAreEqual(current, nextRange) ? current : nextRange));
  }, [
    enabled,
    estimatedViewportHeight,
    overscan,
    rowCount,
    rowGap,
    rowHeight,
    scrollElement,
    stride,
  ]);

  useEffect(() => {
    updateRange();
  }, [updateRange]);

  useEffect(() => {
    if (!enabled) return undefined;

    const element = containerRef.current;
    if (!element) return undefined;

    const scrollContainer = getScrollableAncestor(element, scrollElement);
    const scrollTarget = isWindowScrollContainer(scrollContainer) ? window : scrollContainer;

    scrollTarget.addEventListener('scroll', updateRange, { passive: true });
    window.addEventListener('resize', updateRange);

    const ResizeObserverConstructor = window.ResizeObserver;
    const resizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(updateRange)
      : null;

    resizeObserver?.observe(element);
    if (!isWindowScrollContainer(scrollContainer) && scrollContainer !== element) {
      resizeObserver?.observe(scrollContainer);
    }

    updateRange();

    return () => {
      scrollTarget.removeEventListener('scroll', updateRange);
      window.removeEventListener('resize', updateRange);
      resizeObserver?.disconnect();
    };
  }, [enabled, scrollElement, updateRange]);

  const scrollToRow = useCallback(
    (rowIndex: number) => {
      const element = containerRef.current;
      if (!element || rowCount === 0) return;

      const boundedRowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
      const rowStart = boundedRowIndex * stride;
      const rowEnd = rowStart + rowHeight;
      const scrollContainer = getScrollableAncestor(element, scrollElement);
      const viewportHeight = getElementViewportHeight(scrollContainer, estimatedViewportHeight);
      const visibleStart = getVisibleStart(scrollContainer, element);
      const visibleEnd = visibleStart + viewportHeight;

      if (rowStart >= visibleStart && rowEnd <= visibleEnd) return;

      const nextVisibleStart =
        rowStart < visibleStart ? rowStart : Math.max(0, rowEnd - viewportHeight);

      if (isWindowScrollContainer(scrollContainer)) {
        const delta = nextVisibleStart - visibleStart;
        window.scrollTo({ top: window.scrollY + delta });
      } else if (scrollContainer === element) {
        scrollContainer.scrollTop = nextVisibleStart;
      } else {
        scrollContainer.scrollTop += nextVisibleStart - visibleStart;
      }

      updateRange();
    },
    [estimatedViewportHeight, rowCount, rowHeight, scrollElement, stride, updateRange],
  );

  const shouldVirtualize = enabled && rowCount > 0;
  const displayRange = shouldVirtualize
    ? {
        start: Math.min(range.start, rowCount),
        end: Math.min(
          rowCount,
          Math.max(
            range.end,
            getVisibleRowLimit(rowCount, rowHeight, rowGap, estimatedViewportHeight, overscan),
          ),
        ),
      }
    : { start: 0, end: rowCount };

  const virtualRows = useMemo(
    () =>
      Array.from({ length: Math.max(0, displayRange.end - displayRange.start) }, (_, offset) => {
        const index = displayRange.start + offset;
        return {
          index,
          size: rowHeight,
          start: index * stride,
        };
      }),
    [displayRange.end, displayRange.start, rowHeight, stride],
  );

  return {
    containerRef,
    scrollToRow,
    shouldVirtualize,
    totalSize,
    virtualRows,
  };
}
