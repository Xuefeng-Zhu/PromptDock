import { useCallback, useEffect, useState } from 'react';

export interface LayoutMetrics {
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  scrollWidth: number;
  horizontalOverflow: number;
}

/** Reads the current browser viewport and document overflow in CSS pixels. */
export function readLayoutMetrics(): LayoutMetrics {
  const { clientWidth, scrollWidth } = document.documentElement;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth,
    scrollWidth,
    horizontalOverflow: Math.max(0, scrollWidth - clientWidth),
  };
}

function sameMetrics(current: LayoutMetrics | null, next: LayoutMetrics): boolean {
  return current !== null
    && current.innerWidth === next.innerWidth
    && current.innerHeight === next.innerHeight
    && current.clientWidth === next.clientWidth
    && current.scrollWidth === next.scrollWidth
    && current.horizontalOverflow === next.horizontalOverflow;
}

/**
 * Measures only while requested. DOM changes and resizing are coalesced into a
 * frame so diagnostics reflect real overflow without polling or changing layout.
 */
export function useLayoutMetrics(active: boolean) {
  const [metrics, setMetrics] = useState<LayoutMetrics | null>(null);
  const refresh = useCallback(() => {
    const next = readLayoutMetrics();
    setMetrics((current) => sameMetrics(current, next) ? current : next);
  }, []);

  useEffect(() => {
    if (!active) return;
    let frame: number | null = null;
    function scheduleMeasurement() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        refresh();
      });
    }

    refresh();
    window.addEventListener('resize', scheduleMeasurement);
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleMeasurement);
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);

    // Absolutely positioned content can change scrollWidth without resizing the
    // root box. Observe its DOM/style changes as well as ordinary box resizes.
    const mutationObserver = new MutationObserver(scheduleMeasurement);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open'],
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener('resize', scheduleMeasurement);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [active, refresh]);

  return { metrics, refresh };
}
