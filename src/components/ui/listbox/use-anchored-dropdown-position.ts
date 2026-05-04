import { useLayoutEffect, useState, type RefObject } from 'react';

export type DropdownPlacement = 'top' | 'bottom';

export interface DropdownPosition {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
}

interface UseAnchoredDropdownPositionOptions<T extends HTMLElement> {
  anchorRef: RefObject<T | null>;
  gap?: number;
  maxHeight?: number;
  minHeight?: number;
  open: boolean;
  viewportPadding?: number;
}

const DEFAULT_DROPDOWN_MAX_HEIGHT = 240;

const DEFAULT_DROPDOWN_POSITION: DropdownPosition = {
  left: 0,
  maxHeight: DEFAULT_DROPDOWN_MAX_HEIGHT,
  top: 0,
  width: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useAnchoredDropdownPosition<T extends HTMLElement>({
  anchorRef,
  gap = 8,
  maxHeight = DEFAULT_DROPDOWN_MAX_HEIGHT,
  minHeight = 144,
  open,
  viewportPadding = 12,
}: UseAnchoredDropdownPositionOptions<T>) {
  const [placement, setPlacement] = useState<DropdownPlacement>('bottom');
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>(
    DEFAULT_DROPDOWN_POSITION,
  );

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePlacement() {
      if (!anchorRef.current) return;

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const availableBelow = window.innerHeight - anchorRect.bottom - viewportPadding - gap;
      const availableAbove = anchorRect.top - viewportPadding - gap;
      const nextPlacement =
        availableBelow < maxHeight && availableAbove > availableBelow ? 'top' : 'bottom';
      const availableHeight = nextPlacement === 'top' ? availableAbove : availableBelow;
      const nextMaxHeight = clamp(availableHeight, minHeight, maxHeight);
      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - viewportPadding - anchorRect.width,
      );
      const left = clamp(anchorRect.left, viewportPadding, maxLeft);
      const top =
        nextPlacement === 'top'
          ? Math.max(viewportPadding, anchorRect.top - gap - nextMaxHeight)
          : Math.min(
              anchorRect.bottom + gap,
              window.innerHeight - viewportPadding - nextMaxHeight,
            );

      setPlacement(nextPlacement);
      setDropdownPosition({
        left,
        maxHeight: nextMaxHeight,
        top,
        width: anchorRect.width,
      });
    }

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [anchorRef, gap, maxHeight, minHeight, open, viewportPadding]);

  return { dropdownPosition, placement };
}
