/**
 * Unit tests for ConflictService.
 *
 * Tests conflict detection, resolution, and state management.
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictService } from '../conflict-service';
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

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ConflictService', () => {
  let service: ConflictService;

  beforeEach(() => {
    service = new ConflictService();
  });

  describe('detectConflict', () => {
    it('should return null when prompts have the same id but identical timestamps', () => {
      const local = makePrompt();
      const remote = makePrompt();
      expect(service.detectConflict(local, remote)).toBeNull();
    });

    it('should return null when prompts have different ids', () => {
      const local = makePrompt({ id: 'a' });
      const remote = makePrompt({ id: 'b' });
      expect(service.detectConflict(local, remote)).toBeNull();
    });

    it('should return null when versions match even if timestamps differ', () => {
      const local = makePrompt({ updatedAt: new Date('2024-01-02'), version: 1 });
      const remote = makePrompt({ updatedAt: new Date('2024-01-03'), version: 1 });
      expect(service.detectConflict(local, remote)).toBeNull();
    });

    it('should return null when content is identical despite version/timestamp differences', () => {
      const local = makePrompt({ updatedAt: new Date('2024-01-02'), version: 2 });
      const remote = makePrompt({ updatedAt: new Date('2024-01-03'), version: 3 });
      // Same title and body
      expect(service.detectConflict(local, remote)).toBeNull();
    });

    it('should detect a conflict when title differs with different versions and timestamps', () => {
      const local = makePrompt({
        title: 'Local Title',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        title: 'Remote Title',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.detectConflict(local, remote);
      expect(conflict).not.toBeNull();
      expect(conflict!.promptId).toBe('prompt-1');
      expect(conflict!.localVersion.title).toBe('Local Title');
      expect(conflict!.remoteVersion.title).toBe('Remote Title');
      expect(conflict!.resolvedAt).toBeNull();
    });

    it('should detect a conflict when body differs with different versions and timestamps', () => {
      const local = makePrompt({
        body: 'Local body',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        body: 'Remote body',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.detectConflict(local, remote);
      expect(conflict).not.toBeNull();
      expect(conflict!.localVersion.body).toBe('Local body');
      expect(conflict!.remoteVersion.body).toBe('Remote body');
    });
  });

  describe('addConflict / getUnresolvedConflicts', () => {
    it('should add a conflict and retrieve it', () => {
      const local = makePrompt({
        title: 'Local',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        title: 'Remote',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.detectConflict(local, remote)!;
      service.addConflict(conflict);

      const unresolved = service.getUnresolvedConflicts();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].promptId).toBe('prompt-1');
    });

    it('should replace existing conflict for the same promptId', () => {
      const local1 = makePrompt({
        title: 'Local v1',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote1 = makePrompt({
        title: 'Remote v1',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });
      const conflict1 = service.detectConflict(local1, remote1)!;
      service.addConflict(conflict1);

      const local2 = makePrompt({
        title: 'Local v2',
        updatedAt: new Date('2024-01-04'),
        version: 4,
      });
      const remote2 = makePrompt({
        title: 'Remote v2',
        updatedAt: new Date('2024-01-05'),
        version: 5,
      });
      const conflict2 = service.detectConflict(local2, remote2)!;
      service.addConflict(conflict2);

      const unresolved = service.getUnresolvedConflicts();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].localVersion.title).toBe('Local v2');
    });
  });

  describe('getUnresolvedCount', () => {
    it('should return 0 when no conflicts exist', () => {
      expect(service.getUnresolvedCount()).toBe(0);
    });

    it('should return the correct count of unresolved conflicts', () => {
      const conflict1 = service.processConflict(
        makePrompt({ id: 'p1', title: 'L1', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ id: 'p1', title: 'R1', updatedAt: new Date('2024-01-03'), version: 3 }),
      );
      service.processConflict(
        makePrompt({ id: 'p2', title: 'L2', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ id: 'p2', title: 'R2', updatedAt: new Date('2024-01-03'), version: 3 }),
      );

      expect(service.getUnresolvedCount()).toBe(2);

      // Resolve one
      service.resolveKeepLocal(conflict1!.id);
      expect(service.getUnresolvedCount()).toBe(1);
    });
  });

  describe('resolveKeepLocal', () => {
    it('should resolve a conflict and return the local version', () => {
      const local = makePrompt({
        title: 'Local Title',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        title: 'Remote Title',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.processConflict(local, remote)!;
      const resolved = service.resolveKeepLocal(conflict.id);

      expect(resolved).not.toBeNull();
      expect(resolved!.title).toBe('Local Title');
      expect(service.getUnresolvedCount()).toBe(0);
    });

    it('should return null for an already resolved conflict', () => {
      const conflict = service.processConflict(
        makePrompt({ title: 'L', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ title: 'R', updatedAt: new Date('2024-01-03'), version: 3 }),
      )!;

      service.resolveKeepLocal(conflict.id);
      const secondAttempt = service.resolveKeepLocal(conflict.id);
      expect(secondAttempt).toBeNull();
    });

    it('should return null for a non-existent conflict', () => {
      expect(service.resolveKeepLocal('non-existent')).toBeNull();
    });
  });

  describe('resolveKeepRemote', () => {
    it('should resolve a conflict and return the remote version', () => {
      const local = makePrompt({
        title: 'Local Title',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        title: 'Remote Title',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.processConflict(local, remote)!;
      const resolved = service.resolveKeepRemote(conflict.id);

      expect(resolved).not.toBeNull();
      expect(resolved!.title).toBe('Remote Title');
      expect(service.getUnresolvedCount()).toBe(0);
    });
  });

  describe('processConflict', () => {
    it('should return null when no conflict is detected', () => {
      const local = makePrompt();
      const remote = makePrompt();
      expect(service.processConflict(local, remote)).toBeNull();
    });

    it('should add and return a conflict when detected', () => {
      const local = makePrompt({
        title: 'Local',
        updatedAt: new Date('2024-01-02'),
        version: 2,
      });
      const remote = makePrompt({
        title: 'Remote',
        updatedAt: new Date('2024-01-03'),
        version: 3,
      });

      const conflict = service.processConflict(local, remote);
      expect(conflict).not.toBeNull();
      expect(service.getUnresolvedCount()).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners when conflicts change', () => {
      const listener = vi.fn();
      service.subscribe(listener);

      const conflict = service.processConflict(
        makePrompt({ title: 'L', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ title: 'R', updatedAt: new Date('2024-01-03'), version: 3 }),
      )!;

      expect(listener).toHaveBeenCalledTimes(1);

      service.resolveKeepLocal(conflict.id);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();

      service.processConflict(
        makePrompt({ title: 'L', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ title: 'R', updatedAt: new Date('2024-01-03'), version: 3 }),
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('should remove all conflicts', () => {
      service.processConflict(
        makePrompt({ id: 'p1', title: 'L1', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ id: 'p1', title: 'R1', updatedAt: new Date('2024-01-03'), version: 3 }),
      );
      service.processConflict(
        makePrompt({ id: 'p2', title: 'L2', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ id: 'p2', title: 'R2', updatedAt: new Date('2024-01-03'), version: 3 }),
      );

      expect(service.getUnresolvedCount()).toBe(2);
      service.clearAll();
      expect(service.getUnresolvedCount()).toBe(0);
    });
  });

  describe('findByPromptId', () => {
    it('should find a conflict by prompt ID', () => {
      service.processConflict(
        makePrompt({ id: 'p1', title: 'L', updatedAt: new Date('2024-01-02'), version: 2 }),
        makePrompt({ id: 'p1', title: 'R', updatedAt: new Date('2024-01-03'), version: 3 }),
      );

      const found = service.findByPromptId('p1');
      expect(found).not.toBeNull();
      expect(found!.promptId).toBe('p1');
    });

    it('should return null for a non-existent prompt ID', () => {
      expect(service.findByPromptId('non-existent')).toBeNull();
    });
  });
});
