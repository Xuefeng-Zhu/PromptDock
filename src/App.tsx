import { useState, useEffect } from 'react';
import { LocalStorageBackend } from './repositories/local-storage-backend';
import { BrowserStorageBackend } from './repositories/browser-storage-backend';
import type { IStorageBackend } from './repositories/interfaces';
import type { Folder } from './types/index';
import { PromptRepository } from './repositories/prompt-repository';
import { FolderRepository } from './repositories/folder-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { initPromptStore } from './stores/prompt-store';
import { initFolderStore } from './stores/folder-store';
import { initAppModeStore } from './stores/app-mode-store';
import { initSettingsStore, useSettingsStore } from './stores/settings-store';
import { seedDefaultPrompts } from './services/seed-data';
import { registerHotkey } from './utils/hotkey';
import { AuthService } from './services/auth-service';
import { SyncService } from './services/sync-service';
import type { MigrationChoice } from './services/sync-service';
import { ConflictService } from './services/conflict-service';
import { initializeAnalyticsTracking } from './services/analytics-service';
import { AppModeProvider } from './contexts/AppModeProvider';
import { AppShell } from './components/app-shell';
import { ErrorBoundary } from './components/shared';
import { applyTheme } from './utils/theme';
import { isTauriRuntime } from './utils/runtime';
import { clearLegacyFolders, readLegacyFolders } from './utils/legacy-folder-storage';
import { normalizeFolderName } from './utils/folder-names';

// ─── App Initialization ────────────────────────────────────────────────────────

let initialized = false;
let initializationPromise: Promise<void> | null = null;
let syncServiceInstance: SyncService | null = null;
let conflictServiceInstance: ConflictService | null = null;
let authServiceInstance: AuthService | null = null;

export interface AppInitializationOptions {
  seedDefaultData?: boolean;
  registerGlobalHotkey?: boolean;
  enableBackgroundServices?: boolean;
  restoreAuthSession?: boolean;
  syncMigrationChoice?: MigrationChoice;
  analyticsSurface?: AnalyticsSurface;
}

export type AnalyticsSurface = 'main' | 'quick_launcher';

export function shouldTrackAppOpen(
  enableBackgroundServices: boolean,
  analyticsSurface: AnalyticsSurface,
): boolean {
  return enableBackgroundServices && analyticsSurface === 'main';
}

function mergeLegacyFolders(existingFolders: Folder[], legacyFolders: Folder[]): Folder[] {
  const folders = [...existingFolders];
  const names = new Set(folders.map((folder) => normalizeFolderName(folder.name)));

  for (const folder of legacyFolders) {
    const normalizedName = normalizeFolderName(folder.name);
    if (!normalizedName || names.has(normalizedName)) continue;
    folders.push(folder);
    names.add(normalizedName);
  }

  return folders;
}

/** Get the shared ConflictService instance (available after initialization). */
export function getConflictService(): ConflictService | null {
  return conflictServiceInstance;
}

/** Get the shared SyncService instance (available after sync mode activation). */
export function getSyncService(): SyncService | null {
  return syncServiceInstance;
}

/** Get the shared AuthService instance (available after initialization). */
export function getAuthService(): AuthService | null {
  return authServiceInstance;
}

export function initializeApp(options: AppInitializationOptions = {}): Promise<void> {
  if (initialized) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = runAppInitialization(options)
    .then(() => {
      initialized = true;
    })
    .finally(() => {
      initializationPromise = null;
    });

  return initializationPromise;
}

async function runAppInitialization(options: AppInitializationOptions): Promise<void> {
  const {
    seedDefaultData = true,
    registerGlobalHotkey = true,
    enableBackgroundServices = true,
    restoreAuthSession = enableBackgroundServices,
    syncMigrationChoice = 'migrate',
    analyticsSurface = 'main',
  } = options;

  // 1. Pick the right storage backend based on runtime environment
  const isTauri = isTauriRuntime();
  let backend: IStorageBackend;
  if (isTauri) {
    backend = new LocalStorageBackend();
  } else {
    backend = new BrowserStorageBackend();
  }
  await backend.initialize();

  if (shouldTrackAppOpen(enableBackgroundServices, analyticsSurface)) {
    initializeAnalyticsTracking({
      runtime: isTauri ? 'tauri' : 'browser',
      surface: analyticsSurface,
    });
  }

  // 2. Create repositories
  const promptRepo = new PromptRepository(backend);
  const folderRepo = new FolderRepository(backend);
  const settingsRepo = new SettingsRepository(backend);

  // 3. Initialize Zustand stores with real repositories
  const appModeStore = initAppModeStore();
  const promptStore = initPromptStore(promptRepo);
  const folderStore = initFolderStore(folderRepo);
  const settingsStore = initSettingsStore(settingsRepo);

  // 4. Seed default prompts on first launch
  if (seedDefaultData) {
    await seedDefaultPrompts(promptRepo);
  }

  // 5. Load initial data into stores
  await promptStore.getState().loadPrompts();
  await folderStore.getState().loadFolders();
  const legacyFolders = readLegacyFolders();
  if (legacyFolders.length > 0) {
    const mergedFolders = mergeLegacyFolders(folderStore.getState().folders, legacyFolders);
    await folderRepo.replaceLocalFolders(mergedFolders);
    folderStore.getState().setFolders(mergedFolders);
    clearLegacyFolders();
  }
  await settingsStore.getState().loadSettings();

  // 6. Register global hotkey from settings (best-effort — ignore failures at startup)
  if (registerGlobalHotkey) {
    try {
      const { hotkeyCombo } = settingsStore.getState().settings;
      await registerHotkey(hotkeyCombo);
    } catch {
      // Hotkey registration may fail outside Tauri or if the combo is invalid.
      // The user can re-register from SettingsScreen.
    }
  }

  // 7. Create ConflictService (shared instance)
  if (enableBackgroundServices) {
    conflictServiceInstance = new ConflictService();
  }

  // AuthService is cheap to construct and Firebase remains lazy until a user
  // actually signs in or a session restore is requested.
  authServiceInstance = new AuthService();

  // 8. Subscribe to AppModeStore mode changes to instantiate/teardown SyncService
  if (enableBackgroundServices) {
    appModeStore.subscribe((state, prevState) => {
      const modeChanged = state.mode !== prevState.mode;
      if (!modeChanged) return;

      if (state.mode === 'synced' && !syncServiceInstance) {
        const userId = state.userId ?? '';
        const workspaceId = userId; // default workspace = user ID

        if (!userId) {
          appModeStore.getState().setMode('local');
          appModeStore.getState().setSyncStatus('local');
          return;
        }

        promptStore.getState().setActiveWorkspaceId(workspaceId);
        folderStore.getState().setActiveWorkspaceId(workspaceId);
        void settingsStore.getState().updateSettings({ activeWorkspaceId: workspaceId }).catch((err) => {
          console.error('Failed to persist active workspace after sign-in:', err);
        });

        // Instantiate SyncService when transitioning to synced mode
        syncServiceInstance = new SyncService({
          appModeStore: appModeStore.getState(),
          onRemotePromptsChanged: (prompts) => {
            // 7.2: Update PromptStore with remote prompt list
            promptStore.setState({ prompts });
          },
          onRemoteFoldersChanged: (folders) => {
            folderStore.getState().setFolders(folders);
          },
          onConflictDetected: (local, remote) => {
            // 7.3: Delegate conflict detection to ConflictService
            conflictServiceInstance?.processConflict(local, remote);
          },
        });

        // 7.4: Configure PromptRepository to delegate to FirestoreBackend
        const firestoreBackend = syncServiceInstance.getFirestoreBackend();
        if (firestoreBackend) {
          promptRepo.setFirestoreDelegate(firestoreBackend);
          folderRepo.setFirestoreDelegate(firestoreBackend);
        }

        // Trigger the sync transition: migrate local prompts and start snapshot listeners
        const currentPrompts = promptStore.getState().prompts;
        const currentFolders = folderStore.getState().folders;
        syncServiceInstance.transitionToSynced(
          userId,
          workspaceId,
          currentPrompts,
          syncMigrationChoice,
          currentFolders,
        ).then(() => {
          // Wire PromptRepository to FirestoreBackend after transition completes
          const fb = syncServiceInstance?.getFirestoreBackend();
          if (fb) {
            promptRepo.setFirestoreDelegate(fb);
            folderRepo.setFirestoreDelegate(fb);
          }
        }).catch((err) => {
          console.error('Failed to transition to synced mode:', err);
        });
      } else if (state.mode === 'local' && syncServiceInstance) {
        // Teardown SyncService when transitioning back to local mode
        syncServiceInstance.dispose();
        syncServiceInstance = null;
        // Revert PromptRepository to local-only mode
        promptRepo.setFirestoreDelegate(null);
        folderRepo.setFirestoreDelegate(null);
        promptStore.getState().setActiveWorkspaceId('local');
        folderStore.getState().setActiveWorkspaceId('local');
        void settingsStore.getState().updateSettings({ activeWorkspaceId: 'local' }).catch((err) => {
          console.error('Failed to persist active workspace after sign-out:', err);
        });
        conflictServiceInstance?.clearAll();
        void promptStore.getState().loadPrompts().catch((err) => {
          console.error('Failed to reload local prompts after leaving synced mode:', err);
        });
        void folderStore.getState().loadFolders().catch((err) => {
          console.error('Failed to reload local folders after leaving synced mode:', err);
        });
      }
    });
  }

  // 9. Restore auth session — if a valid user exists, transition to synced mode
  if (restoreAuthSession) {
    const applyRestoredAuth = (result: Awaited<ReturnType<AuthService['restoreSession']>>) => {
      if (result && result.success) {
        const appMode = appModeStore.getState();
        appMode.setUserId(result.user.uid);
        appMode.setMode('synced');
      }
    };

    try {
      const result = await authServiceInstance.restoreSession(applyRestoredAuth);
      applyRestoredAuth(result);
    } catch {
      // Session restore failure is non-fatal — stay in local mode
    }
  }
}

// ─── Theme Manager ─────────────────────────────────────────────────────────────
// Rendered only after stores are initialised so useSettingsStore is safe to call.

export function ThemeManager() {
  const theme = useSettingsStore((s) => s.settings.theme);

  // Apply theme whenever the setting changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // When theme is "system", also listen for OS preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return null;
}

// ─── App (entry point) ─────────────────────────────────────────────────────────

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Failed to initialize app:', err);
        setError(String(err));
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-8 text-center dark:bg-gray-900">
        <div>
          <h1 className="mb-2 text-lg font-bold text-red-600">Initialization Error</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-gray-400">Loading PromptDock…</p>
        </div>
      </div>
    );
  }

  return (
    <AppModeProvider>
      <ThemeManager />
      <ErrorBoundary>
        <AppShell
          authService={authServiceInstance ?? undefined}
          syncService={syncServiceInstance ?? undefined}
        />
      </ErrorBoundary>
    </AppModeProvider>
  );
}

export default App;
