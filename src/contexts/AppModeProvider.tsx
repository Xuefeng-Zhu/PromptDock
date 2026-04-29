import { createContext, useContext, type ReactNode } from 'react';
import { useAppModeStore } from '../stores/app-mode-store';
import type { AppMode } from '../types';

interface AppModeContextValue {
  mode: AppMode;
  userId: string | null;
  isOnline: boolean;
}

const AppModeContext = createContext<AppModeContextValue>({
  mode: 'local',
  userId: null,
  isOnline: true,
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { mode, userId, isOnline } = useAppModeStore();
  return (
    <AppModeContext.Provider value={{ mode, userId, isOnline }}>
      {children}
    </AppModeContext.Provider>
  );
}

export const useAppMode = () => useContext(AppModeContext);
