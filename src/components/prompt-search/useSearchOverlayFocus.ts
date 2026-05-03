import { useEffect, useRef } from 'react';

export function useSearchOverlayFocus(isOpen: boolean) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timer);
    }

    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }

    return undefined;
  }, [isOpen]);

  return searchInputRef;
}
