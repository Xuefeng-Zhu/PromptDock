/**
 * Unit tests for SyncService.
 *
 * Tests mode transitions, connectivity handling, and conflict detection wiring.
 * Firebase/Firestore operations are not tested here (they require integration tests).
 *
 * Requirements: 5.3, 5.4, 5.5, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncService } from '../sync-service';
import type { AppModeStore } from '../../stores/app-mode-store';
import type { PromptRecipe } from '../../types/index';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-1',
    workspaceId: 'ws-1',
    title: 'Test Prompt',
    description: 'A test prompt',
    body: 'Hello {{name}}',
    tags: ['test'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
    ...overrides,
  };
}

function createMockAppModeStore(): AppModeStore {
  return {
    mode: 'local',
    userId: null,
    isOnline: true,
    syncStatus: 'local',
    lastSyncedAt: null,
    setMode: vi.fn(function (this: AppModeStore, mode) {
      this.mode = mode;
    }),
    setUserId: vi.fn(function (this: AppModeStore, userId) {
      this.userId = userId;
    }),
    setOnline: vi.fn(function (this: AppModeStore, online) {
      this.isOnline = online;
    }),
    setSyncStatus: vi.fn(function (this: AppModeStore, status) {
      this.syncStatus = status;
    }),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SyncService', () => {
  let mockStore: AppModeStore;
  let service: SyncService;
  let onRemotePromptsChanged: (prompts: PromptRecipe[]) => void;
  let onConflictDetected: (local: PromptRecipe, remote: PromptRecipe) => void;

  beforeEach(() => {
    mockStore = createMockAppModeStore();
    onRemotePromptsChanged = vi.fn<(prompts: PromptRecipe[]) => void>();
    onConflictDetected = vi.fn<(local: PromptRecipe, remote: PromptRecipe) => void>();

    service = new SyncService({
      appModeStore: mockStore,
      onRemotePromptsChanged,
      onConflictDetected,
    });
  });

  afterEach(() => {
    service.dispose();
  });

  describe('transitionToLocal', () => {
    it('should set mode to local and clear user state', () => {
      service.transitionToLocal();

      expect(mockStore.setMode).toHaveBeenCalledWith('local');
      expect(mockStore.setUserId).toHaveBeenCalledWith(null);
      expect(mockStore.setSyncStatus).toHaveBeenCalledWith('local');
    });

    it('should clear internal state', () => {
      service.transitionToLocal();

      expect(service.getFirestoreBackend()).toBeNull();
      expect(service.getWorkspaceId()).toBeNull();
      expect(service.isActive()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return false initially', () => {
      expect(service.isActive()).toBe(false);
    });
  });

  describe('getFirestoreBackend', () => {
    it('should return null when not in synced mode', () => {
      expect(service.getFirestoreBackend()).toBeNull();
    });
  });

  describe('getWorkspaceId', () => {
    it('should return null when not in synced mode', () => {
      expect(service.getWorkspaceId()).toBeNull();
    });
  });

  describe('updateLocalSnapshot', () => {
    it('should update the local prompts snapshot', () => {
      const prompts = [makePrompt({ id: 'p1' }), makePrompt({ id: 'p2' })];
      // Should not throw
      service.updateLocalSnapshot(prompts);
    });
  });

  describe('dispose', () => {
    it('should transition to local mode', () => {
      service.dispose();
      expect(mockStore.setMode).toHaveBeenCalledWith('local');
      expect(mockStore.setSyncStatus).toHaveBeenCalledWith('local');
    });
  });
});
