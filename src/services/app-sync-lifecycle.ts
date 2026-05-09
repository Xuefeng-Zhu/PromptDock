import type { StoreApi } from 'zustand';
import type { IAuthService } from './interfaces';
import type { MigrationChoice, SyncServiceOptions } from './sync-service';
import { SyncService } from './sync-service';
import type { ConflictService } from './conflict-service';
import type { AppModeStore } from '../stores/app-mode-store';
import type { FolderStore } from '../stores/folder-store';
import type { PromptStore } from '../stores/prompt-store';
import type { SettingsStore } from '../stores/settings-store';
import type { IFolderRepository, IPromptRepository } from '../repositories/interfaces';

type FirestoreDelegate = IPromptRepository & IFolderRepository;

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
): Promise<void> {
  const applyRestoredAuth = (result: Awaited<ReturnType<IAuthService['restoreSession']>>) => {
    if (result?.success) {
      const appMode = appModeStore.getState();
      appMode.setUserId(result.user.uid);
      appMode.setMode('synced');
    }
  };

  try {
    const result = await authService.restoreSession(applyRestoredAuth);
    applyRestoredAuth(result);
  } catch {
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
  private readonly createSyncService: (options: SyncServiceOptions) => SyncLifecycleService;
  private readonly logger: Pick<Console, 'error'>;

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
        this.startSyncedMode(state.userId);
      } else if (state.mode === 'local' && this.syncService) {
        this.teardownSyncedMode();
      }
    });
  }

  stop(): void {
    this.unsubscribeAppMode?.();
    this.unsubscribeAppMode = null;
    this.teardownSyncedMode();
  }

  async restoreAuthSession(): Promise<void> {
    await restoreAppAuthSession(this.options.authService, this.options.appModeStore);
  }

  private startSyncedMode(userId: string | null): void {
    const {
      appModeStore,
      conflictService,
      folderStore,
      onSyncServiceChange,
      promptStore,
      settingsStore,
      syncMigrationChoice,
    } = this.options;

    if (!userId) {
      const appMode = appModeStore.getState();
      appMode.setMode('local');
      appMode.setSyncStatus('local');
      return;
    }

    const workspaceId = userId;
    promptStore.getState().setActiveWorkspaceId(workspaceId);
    folderStore.getState().setActiveWorkspaceId(workspaceId);
    void settingsStore.getState().updateSettings({ activeWorkspaceId: workspaceId }).catch((err) => {
      this.logger.error('Failed to persist active workspace after sign-in:', err);
    });

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
    this.wireFirestoreDelegates(service.getFirestoreBackend());

    const currentPrompts = promptStore.getState().prompts;
    const currentFolders = folderStore.getState().folders;
    void service
      .transitionToSynced(
        userId,
        workspaceId,
        currentPrompts,
        syncMigrationChoice,
        currentFolders,
      )
      .then(() => {
        if (this.syncService === service) {
          this.wireFirestoreDelegates(service.getFirestoreBackend());
        }
      })
      .catch((err) => {
        this.logger.error('Failed to transition to synced mode:', err);
        if (this.syncService === service) {
          this.teardownSyncedMode();
          const appMode = appModeStore.getState();
          appMode.setMode('local');
          appMode.setSyncStatus('local');
        }
      });
  }

  private wireFirestoreDelegates(delegate: FirestoreDelegate | null): void {
    if (!delegate) return;
    this.options.promptRepository.setFirestoreDelegate(delegate);
    this.options.folderRepository.setFirestoreDelegate(delegate);
  }

  private teardownSyncedMode(): void {
    const service = this.syncService;
    if (!service) return;

    this.syncService = null;
    this.options.onSyncServiceChange?.(null);
    service.dispose();
    this.options.promptRepository.setFirestoreDelegate(null);
    this.options.folderRepository.setFirestoreDelegate(null);
    this.options.promptStore.getState().setActiveWorkspaceId('local');
    this.options.folderStore.getState().setActiveWorkspaceId('local');
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
