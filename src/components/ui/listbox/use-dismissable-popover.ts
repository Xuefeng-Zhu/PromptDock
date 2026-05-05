import { useEffect, type RefObject } from 'react';

interface UseDismissablePopoverOptions<T extends HTMLElement> {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  containerRef: RefObject<T | null>;
  onDismiss: () => void;
  open: boolean;
}

export function useDismissablePopover<T extends HTMLElement>({
  closeOnEscape = true,
  closeOnOutsideClick = true,
  containerRef,
  onDismiss,
  open,
}: UseDismissablePopoverOptions<T>) {
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!closeOnOutsideClick) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (closeOnEscape && event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnEscape, closeOnOutsideClick, containerRef, onDismiss, open]);
}
