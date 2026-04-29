import { create } from 'zustand';
import type { AppMode, SyncStatus } from '../types';

interface AppModeStore {
  mode: AppMode;
  userId: string | null;
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  setMode: (mode: AppMode) => void;
  setUserId: (userId: string | null) => void;
  setOnline: (online: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

export const useAppModeStore = create<AppModeStore>((set) => ({
  mode: 'local',
  userId: null,
  isOnline: true,
  syncStatus: 'local',
  lastSyncedAt: null,
  setMode: (mode) => set({ mode }),
  setUserId: (userId) => set({ userId }),
  setOnline: (online) => set({ isOnline: online }),
  setSyncStatus: (status) => set({ syncStatus: status }),
}));
