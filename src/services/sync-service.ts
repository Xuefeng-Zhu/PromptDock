/**
 * SyncService — Manages real-time Firestore sync and mode transitions.
 *
 * Responsibilities:
 * - Start/stop Firestore onSnapshot listeners when transitioning to/from Synced Mode
 * - Update AppModeStore sync status
 * - Handle offline detection and reconnection
 * - Offer migration of local prompts when signing in for the first time
 * - Wire PromptRepository to delegate to FirestoreBackend in Synced Mode
 *
 * Requirements: 5.3, 5.4, 5.5, 2.3, 2.4
 */

import type { PromptRecipe } from '../types/index';
import type { AppModeStore } from '../stores/app-mode-store';
import type { FirestoreBackend } from '../repositories/firestore-backend';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SyncServiceOptions {
  /** The AppModeStore instance for updating mode/sync status. */
  appModeStore: AppModeStore;
  /** Callback invoked when remote prompts change via onSnapshot. */
  onRemotePromptsChanged?: (prompts: PromptRecipe[]) => void;
  /** Callback invoked when a conflict is detected between local and remote. */
  onConflictDetected?: (local: PromptRecipe, remote: PromptRecipe) => void;
}

export type MigrationChoice = 'migrate' | 'fresh';

// ─── SyncService ───────────────────────────────────────────────────────────────

export class SyncService {
  private appModeStore: AppModeStore;
  private onRemotePromptsChanged?: (prompts: PromptRecipe[]) => void;
  private onConflictDetected?: (local: PromptRecipe, remote: PromptRecipe) => void;

  private firestoreBackend: FirestoreBackend | null = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  private unsubscribeOnline: (() => void) | null = null;
  private currentWorkspaceId: string | null = null;
  private currentUserId: string | null = null;
  private localPromptsSnapshot: PromptRecipe[] = [];

  constructor(options: SyncServiceOptions) {
    this.appModeStore = options.appModeStore;
    this.onRemotePromptsChanged = options.onRemotePromptsChanged;
    this.onConflictDetected = options.onConflictDetected;
  }

  // ─── Mode Transitions ──────────────────────────────────────────────────────

  /**
   * Transition from Local Mode to Synced Mode.
   *
   * 1. Creates a FirestoreBackend for the user's workspace
   * 2. Optionally migrates local prompts to Firestore
   * 3. Starts real-time onSnapshot listeners
   * 4. Sets up online/offline detection
   *
   * Requirements: 5.3, 2.3, 2.4
   */
  async transitionToSynced(
    userId: string,
    workspaceId: string,
    localPrompts: PromptRecipe[],
    migrationChoice: MigrationChoice,
  ): Promise<void> {
    this.currentUserId = userId;
    this.currentWorkspaceId = workspaceId;
    this.localPromptsSnapshot = [...localPrompts];

    // Update store to syncing state
    this.appModeStore.setSyncStatus('syncing');
    this.appModeStore.setUserId(userId);

    try {
      // Lazily create FirestoreBackend
      const { FirestoreBackend } = await import('../repositories/firestore-backend');
      this.firestoreBackend = new FirestoreBackend(workspaceId);

      // Migrate local prompts if requested
      if (migrationChoice === 'migrate' && localPrompts.length > 0) {
        await this.migrateLocalPrompts(localPrompts);
      }

      // Start real-time listeners
      await this.startSnapshotListener(workspaceId);

      // Set up online/offline detection
      this.setupConnectivityListeners();

      // Transition complete
      this.appModeStore.setMode('synced');
      this.appModeStore.setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to transition to Synced Mode:', error);
      // Fall back to offline-synced if we have a backend but network failed
      if (this.firestoreBackend) {
        this.appModeStore.setMode('offline-synced');
        this.appModeStore.setSyncStatus('offline');
      } else {
        // Complete failure — stay in local mode
        this.appModeStore.setMode('local');
        this.appModeStore.setSyncStatus('local');
      }
    }
  }

  /**
   * Transition from Synced Mode back to Local Mode (sign-out).
   *
   * Stops all listeners and clears Firestore state.
   */
  transitionToLocal(): void {
    this.stopSnapshotListener();
    this.teardownConnectivityListeners();

    this.firestoreBackend = null;
    this.currentWorkspaceId = null;
    this.currentUserId = null;

    this.appModeStore.setMode('local');
    this.appModeStore.setUserId(null);
    this.appModeStore.setSyncStatus('local');
  }

  /**
   * Handle transition to offline state while in Synced Mode.
   *
   * Requirement: 5.4
   */
  private handleOffline(): void {
    this.appModeStore.setMode('offline-synced');
    this.appModeStore.setOnline(false);
    this.appModeStore.setSyncStatus('offline');
  }

  /**
   * Handle reconnection from offline state.
   *
   * Requirement: 5.5
   */
  private handleOnline(): void {
    this.appModeStore.setOnline(true);

    if (this.appModeStore.mode === 'offline-synced') {
      this.appModeStore.setMode('synced');
      this.appModeStore.setSyncStatus('syncing');

      // Firestore SDK handles automatic sync of pending writes.
      // The onSnapshot listener will fire with updated data once reconnected.
      // We set synced status after a short delay to allow Firestore to catch up.
      setTimeout(() => {
        if (this.appModeStore.mode === 'synced') {
          this.appModeStore.setSyncStatus('synced');
        }
      }, 2000);
    }
  }

  // ─── Firestore Snapshot Listener ───────────────────────────────────────────

  /**
   * Start a real-time onSnapshot listener on the prompts collection.
   *
   * Requirement: 5.3
   */
  private async startSnapshotListener(workspaceId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, query, where, onSnapshot } = await import('firebase/firestore');
    const { firestoreDocToPromptRecipe } = await import('../repositories/firestore-backend');
    type FirestorePromptDoc = import('../repositories/firestore-backend').FirestorePromptDoc;

    const firestore = await getFirebaseFirestore();
    const promptsCol = collection(firestore, 'workspaces', workspaceId, 'prompts');
    const q = query(promptsCol, where('workspaceId', '==', workspaceId));

    this.unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const remotePrompts: PromptRecipe[] = snapshot.docs.map((docSnap) =>
          firestoreDocToPromptRecipe(docSnap.id, docSnap.data() as FirestorePromptDoc),
        );

        // Detect conflicts by comparing with local snapshot
        if (this.onConflictDetected && this.localPromptsSnapshot.length > 0) {
          this.detectConflicts(this.localPromptsSnapshot, remotePrompts);
        }

        // Update local snapshot reference
        this.localPromptsSnapshot = remotePrompts;

        // Notify listeners of remote changes
        this.onRemotePromptsChanged?.(remotePrompts);

        // Update sync status
        if (this.appModeStore.mode === 'synced') {
          this.appModeStore.setSyncStatus('synced');
        }
      },
      (error) => {
        console.error('Firestore snapshot listener error:', error);
        // If we lose connection, transition to offline
        if (error.code === 'unavailable' || error.code === 'permission-denied') {
          this.handleOffline();
        }
      },
    );
  }

  /**
   * Stop the active onSnapshot listener.
   */
  private stopSnapshotListener(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  }

  // ─── Connectivity Listeners ────────────────────────────────────────────────

  /**
   * Set up browser online/offline event listeners.
   */
  private setupConnectivityListeners(): void {
    const onlineHandler = () => this.handleOnline();
    const offlineHandler = () => this.handleOffline();

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    this.unsubscribeOnline = () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };

    // Set initial online state
    this.appModeStore.setOnline(navigator.onLine);
  }

  /**
   * Remove connectivity event listeners.
   */
  private teardownConnectivityListeners(): void {
    if (this.unsubscribeOnline) {
      this.unsubscribeOnline();
      this.unsubscribeOnline = null;
    }
  }

  // ─── Migration ─────────────────────────────────────────────────────────────

  /**
   * Migrate local prompts to Firestore.
   *
   * Requirement: 2.3
   */
  private async migrateLocalPrompts(localPrompts: PromptRecipe[]): Promise<void> {
    if (!this.firestoreBackend || !this.currentWorkspaceId) return;

    for (const prompt of localPrompts) {
      try {
        await this.firestoreBackend.create({
          workspaceId: this.currentWorkspaceId,
          title: prompt.title,
          description: prompt.description,
          body: prompt.body,
          tags: [...prompt.tags],
          folderId: prompt.folderId,
          favorite: prompt.favorite,
          archived: prompt.archived,
          archivedAt: prompt.archivedAt,
          lastUsedAt: prompt.lastUsedAt,
          createdBy: this.currentUserId ?? 'local',
          version: prompt.version,
        });
      } catch (error) {
        console.error(`Failed to migrate prompt "${prompt.title}":`, error);
      }
    }
  }

  // ─── Conflict Detection ────────────────────────────────────────────────────

  /**
   * Compare local and remote prompts to detect conflicts.
   * A conflict occurs when the same prompt (by id) has been modified
   * both locally and remotely since the last sync.
   */
  private detectConflicts(
    localPrompts: PromptRecipe[],
    remotePrompts: PromptRecipe[],
  ): void {
    const localMap = new Map(localPrompts.map((p) => [p.id, p]));

    for (const remote of remotePrompts) {
      const local = localMap.get(remote.id);
      if (!local) continue;

      // Both versions have been modified and differ
      const localUpdated = local.updatedAt.getTime();
      const remoteUpdated = remote.updatedAt.getTime();

      if (
        localUpdated !== remoteUpdated &&
        local.version !== remote.version &&
        (local.body !== remote.body || local.title !== remote.title)
      ) {
        this.onConflictDetected?.(local, remote);
      }
    }
  }

  // ─── Accessors ─────────────────────────────────────────────────────────────

  /**
   * Get the current FirestoreBackend instance (for use by PromptRepository in Synced Mode).
   */
  getFirestoreBackend(): FirestoreBackend | null {
    return this.firestoreBackend;
  }

  /**
   * Get the current workspace ID.
   */
  getWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  /**
   * Check if the service is currently in synced mode with an active listener.
   */
  isActive(): boolean {
    return this.unsubscribeSnapshot !== null;
  }

  /**
   * Update the local prompts snapshot (called by PromptStore after local mutations).
   * This ensures conflict detection compares against the latest local state.
   */
  updateLocalSnapshot(prompts: PromptRecipe[]): void {
    this.localPromptsSnapshot = [...prompts];
  }

  /**
   * Clean up all resources. Call on app shutdown.
   */
  dispose(): void {
    this.transitionToLocal();
  }
}
