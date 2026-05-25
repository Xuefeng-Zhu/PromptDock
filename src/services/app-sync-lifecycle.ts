import type { StoreApi } from 'zustand';
import type { IAuthService } from './interfaces';
import type { MigrationChoice, SyncServiceOptions } from './sync-service';
import { SyncService } from './sync-service';
import type { ConflictService } from './conflict-service';
import type { AppModeStore } from '../stores/app-mode-store';
import type { FolderStore } from '../stores/folder-store';
import type { PromptStore } from '../stores/prompt-store';
import type { SettingsStore } from '../stores/settings-store';
import type { WorkspaceStore } from '../stores/workspace-store';
import type { IFolderRepository, IPromptRepository } from '../repositories/interfaces';
import type { AuthUser, Folder, PromptRecipe } from '../types/index';

type FirestoreDelegate = IPromptRepository & IFolderRepository;

function rejectWorkspaceTransition<T>(workspaceId: string): Promise<T> {
  return Promise.reject(
    new Error(`Workspace ${workspaceId} is still syncing. Try again when sync completes.`),
  );
}

function createBlockedFirestoreDelegate(workspaceId: string): FirestoreDelegate {
  return {
    create: () => rejectWorkspaceTransition<PromptRecipe>(workspaceId),
    getById: () => rejectWorkspaceTransition<PromptRecipe | null>(workspaceId),
    getAll: () => rejectWorkspaceTransition<PromptRecipe[]>(workspaceId),
    reloadAll: () => rejectWorkspaceTransition<PromptRecipe[]>(workspaceId),
    update: () => rejectWorkspaceTransition<PromptRecipe>(workspaceId),
    delete: () => rejectWorkspaceTransition<void>(workspaceId),
    softDelete: () => rejectWorkspaceTransition<void>(workspaceId),
    restore: () => rejectWorkspaceTransition<void>(workspaceId),
    duplicate: () => rejectWorkspaceTransition<PromptRecipe>(workspaceId),
    duplicateToWorkspace: () => rejectWorkspaceTransition<PromptRecipe>(workspaceId),
    toggleFavorite: () => rejectWorkspaceTransition<PromptRecipe>(workspaceId),
    createFolder: () => rejectWorkspaceTransition<Folder>(workspaceId),
    deleteFolder: () => rejectWorkspaceTransition<void>(workspaceId),
    getAllFolders: () => rejectWorkspaceTransition<Folder[]>(workspaceId),
    reloadAllFolders: () => rejectWorkspaceTransition<Folder[]>(workspaceId),
  };
}

export interface SyncLifecycleService {
  transitionToSynced: (
    userId: string,
    workspaceId: string,
    localPrompts: Parameters<SyncService['transitionToSynced']>[2],
    migrationChoice: MigrationChoice,
    localFolders: Parameters<SyncService['transitionToSynced']>[4],
  ) => Promise<void>;
  getFirestoreBackend: () => FirestoreDelegate | null;
  dispose: () => void;
}

interface PromptRepositoryDelegateTarget {
  setFirestoreDelegate(delegate: IPromptRepository | null): void;
}

interface FolderRepositoryDelegateTarget {
  setFirestoreDelegate(delegate: IFolderRepository | null): void;
}

export interface AppSyncLifecycleOptions {
  appModeStore: StoreApi<AppModeStore>;
  promptStore: StoreApi<PromptStore>;
  folderStore: StoreApi<FolderStore>;
  settingsStore: StoreApi<SettingsStore>;
  workspaceStore: StoreApi<WorkspaceStore>;
  promptRepository: PromptRepositoryDelegateTarget;
  folderRepository: FolderRepositoryDelegateTarget;
  authService: Pick<IAuthService, 'restoreSession'>;
  conflictService: ConflictService | null;
  syncMigrationChoice: MigrationChoice;
  createSyncService?: (options: SyncServiceOptions) => SyncLifecycleService;
  onSyncServiceChange?: (service: SyncLifecycleService | null) => void;
  logger?: Pick<Console, 'error'>;
}

/**
 * Restores Firebase auth state into AppModeStore without assuming sync services
 * are enabled. Late restore callbacks use the same path as the initial result.
 */
export async function restoreAppAuthSession(
  authService: Pick<IAuthService, 'restoreSession'>,
  appModeStore: StoreApi<AppModeStore>,
  logger: Pick<Console, 'error'> = console,
): Promise<void> {
  const applyRestoredAuth = (result: Awaited<ReturnType<IAuthService['restoreSession']>>) => {
    if (result?.success) {
      const appMode = appModeStore.getState();
      appMode.setUser(result.user);
      appMode.setSyncStatus('syncing');
      appMode.setMode('synced');
    }
  };

  try {
    const result = await authService.restoreSession(applyRestoredAuth);
    applyRestoredAuth(result);
  } catch (err) {
    logger.error('Failed to restore auth session:', err);
    // Session restore failure is non-fatal; app startup remains in local mode.
  }
}

/**
 * Owns auth restore and synced-mode lifecycle wiring for the app shell.
 * App startup provides concrete stores/repositories; this helper handles mode
 * transitions, Firestore delegate timing, and sign-out teardown in one testable
 * place instead of burying that orchestration in the root React component.
 */
export class AppSyncLifecycle {
  private syncService: SyncLifecycleService | null = null;
  private unsubscribeAppMode: (() => void) | null = null;
  private unsubscribeWorkspace: (() => void) | null = null;
  private readonly createSyncService: (options: SyncServiceOptions) => SyncLifecycleService;
  private readonly logger: Pick<Console, 'error'>;
  private isApplyingWorkspace = false;
  private workspaceTransitionToken = 0;

  constructor(private readonly options: AppSyncLifecycleOptions) {
    this.createSyncService = options.createSyncService ?? ((syncOptions) => new SyncService(syncOptions));
    this.logger = options.logger ?? console;
  }

  getSyncService(): SyncLifecycleService | null {
    return this.syncService;
  }

  start(): void {
    if (this.unsubscribeAppMode) return;

    this.unsubscribeAppMode = this.options.appModeStore.subscribe((state, prevState) => {
      if (state.mode === prevState.mode) return;

      if (state.mode === 'synced' && !this.syncService) {
        void this.startSyncedMode();
      } else if (state.mode === 'local' && this.syncService) {
        this.teardownSyncedMode();
      }
    });

    this.unsubscribeWorkspace = this.options.workspaceStore.subscribe((state, prevState) => {
      if (state.activeWorkspaceId === prevState.activeWorkspaceId) return;
      if (this.isApplyingWorkspace || !this.syncService) return;
      if (this.options.appModeStore.getState().mode === 'local') return;

      void this.transitionActiveWorkspace(state.activeWorkspaceId);
    });
  }

  stop(): void {
    this.unsubscribeAppMode?.();
    this.unsubscribeAppMode = null;
    this.unsubscribeWorkspace?.();
    this.unsubscribeWorkspace = null;
    this.teardownSyncedMode();
  }

  async restoreAuthSession(): Promise<void> {
    await restoreAppAuthSession(
      this.options.authService,
      this.options.appModeStore,
      this.logger,
    );
  }

  private getCurrentAuthUser(): AuthUser | null {
    const { userDisplayName, userEmail, userId } = this.options.appModeStore.getState();
    if (!userId) return null;

    return {
      uid: userId,
      email: userEmail ?? '',
      displayName: userDisplayName,
    };
  }

  private async startSyncedMode(): Promise<void> {
    const {
      appModeStore,
      conflictService,
      folderStore,
      onSyncServiceChange,
      promptStore,
      settingsStore,
      workspaceStore,
      syncMigrationChoice,
    } = this.options;
    const user = this.getCurrentAuthUser();

    if (!user) {
      const appMode = appModeStore.getState();
      appMode.setMode('local');
      appMode.setSyncStatus('local');
      return;
    }

    const preferredWorkspaceId = settingsStore.getState().settings.activeWorkspaceId;
    let workspaceId: string;
    try {
      workspaceId = await workspaceStore.getState().loadForUser(user, preferredWorkspaceId);
    } catch (err) {
      this.logger.error('Failed to load workspaces after sign-in:', err);
      const appMode = appModeStore.getState();
      appMode.setMode('local');
      appMode.setSyncStatus('local');
      return;
    }

    const service = this.createSyncService({
      appModeStore: appModeStore.getState(),
      onRemotePromptsChanged: (prompts) => {
        promptStore.setState({ prompts });
      },
      onRemoteFoldersChanged: (folders) => {
        folderStore.getState().setFolders(folders);
      },
      onConflictDetected: (local, remote) => {
        conflictService?.processConflict(local, remote);
      },
    });

    this.syncService = service;
    onSyncServiceChange?.(service);
    const transitionToken = ++this.workspaceTransitionToken;
    this.wireFirestoreDelegates(service.getFirestoreBackend(), workspaceId);

    this.applyWorkspaceTarget(workspaceId);
    const currentPrompts = promptStore.getState().prompts;
    const currentFolders = folderStore.getState().folders;
    const migrationChoice = workspaceId === user.uid ? syncMigrationChoice : 'fresh';
    void service
      .transitionToSynced(
        user.uid,
        workspaceId,
        currentPrompts,
        migrationChoice,
        currentFolders,
      )
      .then(() => {
        if (this.syncService === service && this.workspaceTransitionToken === transitionToken) {
          this.wireFirestoreDelegates(service.getFirestoreBackend(), workspaceId);
        }
      })
      .catch((err) => {
        this.logger.error('Failed to transition to synced mode:', err);
        if (this.syncService === service && this.workspaceTransitionToken === transitionToken) {
          this.teardownSyncedMode();
          const appMode = appModeStore.getState();
          appMode.setMode('local');
          appMode.setSyncStatus('local');
        }
      });
  }

  private applyWorkspaceTarget(workspaceId: string): void {
    this.isApplyingWorkspace = true;
    try {
      this.options.promptStore.getState().setActiveWorkspaceId(workspaceId);
      this.options.folderStore.getState().setActiveWorkspaceId(workspaceId);
    } finally {
      this.isApplyingWorkspace = false;
    }
    void this.options.settingsStore.getState().updateSettings({ activeWorkspaceId: workspaceId }).catch((err) => {
      this.logger.error('Failed to persist active workspace:', err);
    });
  }

  private async transitionActiveWorkspace(workspaceId: string): Promise<void> {
    const user = this.getCurrentAuthUser();
    const service = this.syncService;
    if (!user || !service) return;

    const transitionToken = ++this.workspaceTransitionToken;
    this.applyWorkspaceTarget(workspaceId);
    this.wireFirestoreDelegates(null, workspaceId);
    this.options.conflictService?.clearAll();
    this.options.promptStore.setState({ prompts: [], selectedPromptId: null });
    this.options.folderStore.getState().setFolders([]);

    try {
      await service.transitionToSynced(user.uid, workspaceId, [], 'fresh', []);
      if (this.syncService === service && this.workspaceTransitionToken === transitionToken) {
        this.wireFirestoreDelegates(service.getFirestoreBackend(), workspaceId);
      }
    } catch (err) {
      if (this.syncService === service && this.workspaceTransitionToken === transitionToken) {
        this.logger.error('Failed to switch workspace:', err);
        const delegate = service.getFirestoreBackend();
        if (delegate) {
          this.wireFirestoreDelegates(delegate, workspaceId);
        } else {
          this.clearFirestoreDelegates();
        }
      }
    }
  }

  private wireFirestoreDelegates(delegate: FirestoreDelegate | null, workspaceId: string): void {
    const targetDelegate = delegate ?? createBlockedFirestoreDelegate(workspaceId);
    this.options.promptRepository.setFirestoreDelegate(targetDelegate);
    this.options.folderRepository.setFirestoreDelegate(targetDelegate);
  }

  private clearFirestoreDelegates(): void {
    this.options.promptRepository.setFirestoreDelegate(null);
    this.options.folderRepository.setFirestoreDelegate(null);
  }

  private teardownSyncedMode(): void {
    const service = this.syncService;
    if (!service) return;

    this.syncService = null;
    this.workspaceTransitionToken += 1;
    this.options.onSyncServiceChange?.(null);
    service.dispose();
    this.clearFirestoreDelegates();
    this.options.promptStore.getState().setActiveWorkspaceId('local');
    this.options.folderStore.getState().setActiveWorkspaceId('local');
    this.options.workspaceStore.getState().resetLocal();
    void this.options.settingsStore.getState().updateSettings({ activeWorkspaceId: 'local' }).catch((err) => {
      this.logger.error('Failed to persist active workspace after sign-out:', err);
    });
    this.options.conflictService?.clearAll();
    void this.options.promptStore.getState().loadPrompts().catch((err) => {
      this.logger.error('Failed to reload local prompts after leaving synced mode:', err);
    });
    void this.options.folderStore.getState().loadFolders().catch((err) => {
      this.logger.error('Failed to reload local folders after leaving synced mode:', err);
    });
  }
}
