import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number; // ms, default 5000
}

export interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

let nextId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast(message: string, type: Toast['type'], duration = 5000) {
    const id = `toast-${nextId++}`;
    const toast: Toast = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast(id: string) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
