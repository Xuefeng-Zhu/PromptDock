import { createContext, useContext, type ReactNode } from 'react';
import { useAppModeStore } from '../stores/app-mode-store';
import type { AppMode, AppModeState } from '../types/index';

// ─── Context ───────────────────────────────────────────────────────────────────

const AppModeContext = createContext<AppModeState | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export interface AppModeProviderProps {
  children: ReactNode;
}

/**
 * Bridges the Zustand AppModeStore into React context so that components
 * can consume `mode`, `userId`, and `isOnline` via `useAppMode()` without
 * depending on Zustand directly.
 */
export function AppModeProvider({ children }: AppModeProviderProps) {
  const mode: AppMode = useAppModeStore((s) => s.mode);
  const userId: string | null = useAppModeStore((s) => s.userId);
  const isOnline: boolean = useAppModeStore((s) => s.isOnline);

  const value: AppModeState = { mode, userId, isOnline };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
}

// ─── Consumer hook ─────────────────────────────────────────────────────────────

/**
 * Returns the current `AppModeState` from the nearest `AppModeProvider`.
 * Throws if called outside the provider tree.
 */
export function useAppMode(): AppModeState {
  const ctx = useContext(AppModeContext);
  if (ctx === null) {
    throw new Error(
      'useAppMode must be used within an <AppModeProvider>. ' +
        'Wrap your component tree with <AppModeProvider>.',
    );
  }
  return ctx;
}
