import { describe, it, expect, beforeEach } from 'vitest';
import type { StoreApi } from 'zustand';
import { createAppModeStore, type AppModeStore } from '../app-mode-store';

describe('AppModeStore', () => {
  let store: StoreApi<AppModeStore>;

  beforeEach(() => {
    store = createAppModeStore();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should default mode to "local"', () => {
      expect(store.getState().mode).toBe('local');
    });

    it('should default userId to null', () => {
      expect(store.getState().userId).toBeNull();
    });

    it('should default isOnline to true', () => {
      expect(store.getState().isOnline).toBe(true);
    });

    it('should default syncStatus to "local"', () => {
      expect(store.getState().syncStatus).toBe('local');
    });

    it('should default lastSyncedAt to null', () => {
      expect(store.getState().lastSyncedAt).toBeNull();
    });
  });

  // ── setMode ────────────────────────────────────────────────────────────────

  describe('setMode', () => {
    it('should update mode to "synced"', () => {
      store.getState().setMode('synced');
      expect(store.getState().mode).toBe('synced');
    });

    it('should update mode to "offline-synced"', () => {
      store.getState().setMode('offline-synced');
      expect(store.getState().mode).toBe('offline-synced');
    });

    it('should update mode back to "local"', () => {
      store.getState().setMode('synced');
      store.getState().setMode('local');
      expect(store.getState().mode).toBe('local');
    });
  });

  // ── setUserId ──────────────────────────────────────────────────────────────

  describe('setUserId', () => {
    it('should set a userId', () => {
      store.getState().setUserId('user-123');
      expect(store.getState().userId).toBe('user-123');
    });

    it('should clear userId by setting to null', () => {
      store.getState().setUserId('user-123');
      store.getState().setUserId(null);
      expect(store.getState().userId).toBeNull();
    });
  });

  // ── setOnline ──────────────────────────────────────────────────────────────

  describe('setOnline', () => {
    it('should set isOnline to false', () => {
      store.getState().setOnline(false);
      expect(store.getState().isOnline).toBe(false);
    });

    it('should set isOnline back to true', () => {
      store.getState().setOnline(false);
      store.getState().setOnline(true);
      expect(store.getState().isOnline).toBe(true);
    });
  });

  // ── setSyncStatus ──────────────────────────────────────────────────────────

  describe('setSyncStatus', () => {
    it('should update syncStatus to "syncing"', () => {
      store.getState().setSyncStatus('syncing');
      expect(store.getState().syncStatus).toBe('syncing');
    });

    it('should update syncStatus to "offline"', () => {
      store.getState().setSyncStatus('offline');
      expect(store.getState().syncStatus).toBe('offline');
    });

    it('should update syncStatus to "pending-changes"', () => {
      store.getState().setSyncStatus('pending-changes');
      expect(store.getState().syncStatus).toBe('pending-changes');
    });

    it('should set lastSyncedAt when status becomes "synced"', () => {
      expect(store.getState().lastSyncedAt).toBeNull();
      store.getState().setSyncStatus('synced');
      expect(store.getState().lastSyncedAt).toBeInstanceOf(Date);
    });

    it('should not update lastSyncedAt for non-synced statuses', () => {
      store.getState().setSyncStatus('synced');
      const syncedAt = store.getState().lastSyncedAt;

      store.getState().setSyncStatus('syncing');
      expect(store.getState().lastSyncedAt).toBe(syncedAt);
    });
  });
});
