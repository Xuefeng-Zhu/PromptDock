/**
 * SyncService — Manages real-time Firestore sync and mode transitions.
 *
 * Responsibilities:
 * - Start/stop Firestore onSnapshot listeners when transitioning to/from Synced Mode
 * - Update AppModeStore sync status
 * - Handle offline detection and reconnection
 * - Offer migration of local prompts and folders when signing in for the first time
 * - Wire repositories to delegate to FirestoreBackend in Synced Mode
 *
 * Requirements: 5.3, 5.4, 5.5, 2.3, 2.4
 */

import type { Folder, PromptRecipe } from '../types/index';
import type { AppModeStore } from '../stores/app-mode-store';
import type { FirestoreBackend } from '../repositories/firestore-backend';
import { normalizeFolderName } from '../utils/folder-names';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SyncServiceOptions {
  /** The AppModeStore instance for updating mode/sync status. */
  appModeStore: AppModeStore;
  /** Callback invoked when remote prompts change via onSnapshot. */
  onRemotePromptsChanged?: (prompts: PromptRecipe[]) => void;
  /** Callback invoked when remote folders change via onSnapshot. */
  onRemoteFoldersChanged?: (folders: Folder[]) => void;
  /** Callback invoked when a conflict is detected between local and remote. */
  onConflictDetected?: (local: PromptRecipe, remote: PromptRecipe) => void;
}

export type MigrationChoice = 'migrate' | 'fresh';

// ─── SyncService ───────────────────────────────────────────────────────────────

export class SyncService {
  private appModeStore: AppModeStore;
  private onRemotePromptsChanged?: (prompts: PromptRecipe[]) => void;
  private onRemoteFoldersChanged?: (folders: Folder[]) => void;
  private onConflictDetected?: (local: PromptRecipe, remote: PromptRecipe) => void;

  private firestoreBackend: FirestoreBackend | null = null;
  private unsubscribePromptSnapshot: (() => void) | null = null;
  private unsubscribeFolderSnapshot: (() => void) | null = null;
  private unsubscribeOnline: (() => void) | null = null;
  private currentWorkspaceId: string | null = null;
  private currentUserId: string | null = null;
  private localPromptsSnapshot: PromptRecipe[] = [];

  constructor(options: SyncServiceOptions) {
    this.appModeStore = options.appModeStore;
    this.onRemotePromptsChanged = options.onRemotePromptsChanged;
    this.onRemoteFoldersChanged = options.onRemoteFoldersChanged;
    this.onConflictDetected = options.onConflictDetected;
  }

  // ─── Mode Transitions ──────────────────────────────────────────────────────

  /**
   * Transition from Local Mode to Synced Mode.
   *
   * 1. Creates a FirestoreBackend for the user's workspace
   * 2. Optionally migrates local prompts and folders to Firestore
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
    localFolders: Folder[] = [],
  ): Promise<void> {
    this.stopSnapshotListener();
    this.teardownConnectivityListeners();

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
      if (migrationChoice === 'migrate' && localFolders.length > 0) {
        await this.migrateLocalFolders(localFolders);
      }

      // Start real-time listeners
      await this.startSnapshotListeners(workspaceId);

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
   * Start real-time onSnapshot listeners on the prompts and folders collections.
   *
   * Requirement: 5.3
   */
  private async startSnapshotListeners(workspaceId: string): Promise<void> {
    await Promise.all([
      this.startPromptSnapshotListener(workspaceId),
      this.startFolderSnapshotListener(workspaceId),
    ]);
  }

  private async startPromptSnapshotListener(workspaceId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, query, where, onSnapshot } = await import('firebase/firestore');
    const { firestoreDocToPromptRecipe } = await import('../repositories/firestore-backend');
    type FirestorePromptDoc = import('../repositories/firestore-backend').FirestorePromptDoc;

    const firestore = await getFirebaseFirestore();
    const promptsCol = collection(firestore, 'workspaces', workspaceId, 'prompts');
    const q = query(promptsCol, where('workspaceId', '==', workspaceId));

    this.unsubscribePromptSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const remotePrompts: PromptRecipe[] = snapshot.docs.map((docSnap) =>
          firestoreDocToPromptRecipe(
            docSnap.id,
            docSnap.data({ serverTimestamps: 'estimate' }) as FirestorePromptDoc,
          ),
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

  private async startFolderSnapshotListener(workspaceId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, onSnapshot } = await import('firebase/firestore');
    const { firestoreDocToFolder } = await import('../repositories/firestore-backend');
    type FirestoreFolderDoc = import('../repositories/firestore-backend').FirestoreFolderDoc;

    const firestore = await getFirebaseFirestore();
    const foldersCol = collection(firestore, 'workspaces', workspaceId, 'folders');

    this.unsubscribeFolderSnapshot = onSnapshot(
      foldersCol,
      (snapshot) => {
        const remoteFolders: Folder[] = snapshot.docs.map((docSnap) =>
          firestoreDocToFolder(
            docSnap.id,
            docSnap.data({ serverTimestamps: 'estimate' }) as FirestoreFolderDoc,
          ),
        );

        this.onRemoteFoldersChanged?.(remoteFolders);
      },
      (error) => {
        console.error('Firestore folder snapshot listener error:', error);
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
    if (this.unsubscribePromptSnapshot) {
      this.unsubscribePromptSnapshot();
      this.unsubscribePromptSnapshot = null;
    }
    if (this.unsubscribeFolderSnapshot) {
      this.unsubscribeFolderSnapshot();
      this.unsubscribeFolderSnapshot = null;
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

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc, setDoc, Timestamp } = await import('firebase/firestore');
    const firestore = await getFirebaseFirestore();

    for (const prompt of localPrompts) {
      try {
        const promptRef = doc(
          firestore,
          'workspaces',
          this.currentWorkspaceId,
          'prompts',
          prompt.id,
        );
        const existing = await getDoc(promptRef);
        if (existing.exists()) {
          continue;
        }

        await setDoc(promptRef, {
          title: prompt.title,
          description: prompt.description,
          body: prompt.body,
          tags: [...prompt.tags],
          folderId: prompt.folderId,
          favorite: prompt.favorite,
          archived: prompt.archived,
          archivedAt: prompt.archivedAt ? Timestamp.fromDate(prompt.archivedAt) : null,
          createdAt: Timestamp.fromDate(prompt.createdAt),
          updatedAt: Timestamp.fromDate(prompt.updatedAt),
          lastUsedAt: prompt.lastUsedAt ? Timestamp.fromDate(prompt.lastUsedAt) : null,
          createdBy: this.currentUserId ?? 'local',
          version: prompt.version,
          workspaceId: this.currentWorkspaceId,
        });
      } catch (error) {
        console.error(`Failed to migrate prompt "${prompt.title}":`, error);
      }
    }
  }

  private async migrateLocalFolders(localFolders: Folder[]): Promise<void> {
    if (!this.firestoreBackend || !this.currentWorkspaceId) return;

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, doc, getDoc, getDocs, setDoc, Timestamp } = await import('firebase/firestore');
    const firestore = await getFirebaseFirestore();
    const foldersCol = collection(firestore, 'workspaces', this.currentWorkspaceId, 'folders');
    const remoteFolders = await getDocs(foldersCol);
    const remoteFolderNames = new Set(
      remoteFolders.docs
        .map((docSnap) => {
          const data = docSnap.data() as { name?: unknown; normalizedName?: unknown };
          if (typeof data.normalizedName === 'string') return data.normalizedName;
          return typeof data.name === 'string' ? normalizeFolderName(data.name) : '';
        })
        .filter(Boolean),
    );

    for (const folder of localFolders) {
      try {
        const normalizedName = normalizeFolderName(folder.name);
        if (!normalizedName || remoteFolderNames.has(normalizedName)) {
          continue;
        }

        const folderRef = doc(
          firestore,
          'workspaces',
          this.currentWorkspaceId,
          'folders',
          folder.id,
        );
        const existing = await getDoc(folderRef);
        if (existing.exists()) {
          remoteFolderNames.add(normalizedName);
          continue;
        }

        await setDoc(folderRef, {
          name: folder.name,
          normalizedName,
          createdAt: Timestamp.fromDate(folder.createdAt),
          updatedAt: Timestamp.fromDate(folder.updatedAt),
        });
        remoteFolderNames.add(normalizedName);
      } catch (error) {
        console.error(`Failed to migrate folder "${folder.name}":`, error);
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
    return this.unsubscribePromptSnapshot !== null || this.unsubscribeFolderSnapshot !== null;
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
