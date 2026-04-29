/**
 * ConflictService — Manages conflict detection and resolution for synced prompts.
 *
 * Responsibilities:
 * - Compare local and remote versions of a prompt
 * - Create PromptConflict objects when both have been modified
 * - Provide resolution methods (keepLocal, keepRemote)
 * - Track unresolved conflicts
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import type { PromptRecipe, PromptConflict } from '../types/index';

// ─── ConflictService ───────────────────────────────────────────────────────────

export class ConflictService {
  private conflicts: Map<string, PromptConflict> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Detect whether a conflict exists between a local and remote version
   * of the same prompt. A conflict is detected when:
   * - Both versions have different updatedAt timestamps
   * - Both versions have different version numbers
   * - The content (title or body) differs between versions
   *
   * Requirement: 18.1
   */
  detectConflict(local: PromptRecipe, remote: PromptRecipe): PromptConflict | null {
    if (local.id !== remote.id) return null;

    const localUpdated = local.updatedAt.getTime();
    const remoteUpdated = remote.updatedAt.getTime();

    // No conflict if timestamps match (same version)
    if (localUpdated === remoteUpdated) return null;

    // No conflict if versions match
    if (local.version === remote.version) return null;

    // No conflict if content is identical
    if (local.title === remote.title && local.body === remote.body) return null;

    // Conflict detected — create a PromptConflict document
    const conflict: PromptConflict = {
      id: crypto.randomUUID(),
      promptId: local.id,
      localVersion: { ...local },
      remoteVersion: { ...remote },
      detectedAt: new Date(),
      resolvedAt: null,
    };

    return conflict;
  }

  /**
   * Add a detected conflict to the unresolved conflicts list.
   * If a conflict already exists for the same promptId, it is replaced.
   *
   * Requirement: 18.1
   */
  addConflict(conflict: PromptConflict): void {
    // Replace any existing conflict for the same prompt
    const existing = this.findByPromptId(conflict.promptId);
    if (existing) {
      this.conflicts.delete(existing.id);
    }

    this.conflicts.set(conflict.id, conflict);
    this.notifyListeners();
  }

  /**
   * Process a pair of local and remote prompts: detect and add conflict if found.
   * Returns the conflict if one was created, null otherwise.
   */
  processConflict(local: PromptRecipe, remote: PromptRecipe): PromptConflict | null {
    const conflict = this.detectConflict(local, remote);
    if (conflict) {
      this.addConflict(conflict);
    }
    return conflict;
  }

  /**
   * Get all unresolved conflicts.
   *
   * Requirement: 18.3
   */
  getUnresolvedConflicts(): PromptConflict[] {
    return Array.from(this.conflicts.values()).filter((c) => c.resolvedAt === null);
  }

  /**
   * Get the count of unresolved conflicts (for badge display).
   *
   * Requirement: 18.2
   */
  getUnresolvedCount(): number {
    return this.getUnresolvedConflicts().length;
  }

  /**
   * Get a specific conflict by ID.
   */
  getConflictById(id: string): PromptConflict | null {
    return this.conflicts.get(id) ?? null;
  }

  /**
   * Find a conflict by prompt ID.
   */
  findByPromptId(promptId: string): PromptConflict | null {
    for (const conflict of this.conflicts.values()) {
      if (conflict.promptId === promptId && conflict.resolvedAt === null) {
        return conflict;
      }
    }
    return null;
  }

  /**
   * Resolve a conflict by keeping the local version.
   * Returns the local version that should be written to the repository.
   *
   * Requirement: 18.4
   */
  resolveKeepLocal(conflictId: string): PromptRecipe | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.resolvedAt !== null) return null;

    conflict.resolvedAt = new Date();
    this.notifyListeners();
    return conflict.localVersion;
  }

  /**
   * Resolve a conflict by keeping the remote version.
   * Returns the remote version that should be written to the repository.
   *
   * Requirement: 18.5
   */
  resolveKeepRemote(conflictId: string): PromptRecipe | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.resolvedAt !== null) return null;

    conflict.resolvedAt = new Date();
    this.notifyListeners();
    return conflict.remoteVersion;
  }

  /**
   * Subscribe to conflict changes. Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clear all conflicts (e.g., on sign-out).
   */
  clearAll(): void {
    this.conflicts.clear();
    this.notifyListeners();
  }

  /**
   * Notify all listeners of a change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
