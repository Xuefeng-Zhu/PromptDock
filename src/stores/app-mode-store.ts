import { create, type StoreApi, useStore } from 'zustand';
import type { AppMode, SyncStatus } from '../types/index';

// ─── AppModeStore ──────────────────────────────────────────────────────────────

export interface AppModeStore {
  // State
  mode: AppMode;
  userId: string | null;
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;

  // Actions
  setMode: (mode: AppMode) => void;
  setUserId: (userId: string | null) => void;
  setOnline: (online: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

// ─── Factory ───────────────────────────────────────────────────────────────────
// Creates a standalone Zustand store for application mode state.

export function createAppModeStore() {
  return create<AppModeStore>((set) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    mode: 'local',
    userId: null,
    isOnline: true,
    syncStatus: 'local',
    lastSyncedAt: null,

    // ── Actions ──────────────────────────────────────────────────────────────

    setMode(mode: AppMode) {
      set({ mode });
    },

    setUserId(userId: string | null) {
      set({ userId });
    },

    setOnline(online: boolean) {
      set({ isOnline: online });
    },

    setSyncStatus(status: SyncStatus) {
      set({
        syncStatus: status,
        ...(status === 'synced' ? { lastSyncedAt: new Date() } : {}),
      });
    },
  }));
}

// ─── Singleton convenience hook ────────────────────────────────────────────────
// For production use, call `initAppModeStore` once at app startup, then use
// `useAppModeStore` in components.

let _store: StoreApi<AppModeStore> | null = null;

export function initAppModeStore(): StoreApi<AppModeStore> {
  _store = createAppModeStore();
  return _store;
}

export function useAppModeStore(): AppModeStore;
export function useAppModeStore<T>(selector: (state: AppModeStore) => T): T;
export function useAppModeStore<T>(selector?: (state: AppModeStore) => T) {
  if (!_store) {
    throw new Error(
      'AppModeStore has not been initialised. Call initAppModeStore() before using useAppModeStore.',
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return selector ? useStore(_store, selector) : useStore(_store);
}
