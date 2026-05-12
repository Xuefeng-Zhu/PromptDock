import { useState, useEffect } from 'react';
import { LocalStorageBackend } from './repositories/local-storage-backend';
import { BrowserStorageBackend } from './repositories/browser-storage-backend';
import type { IStorageBackend } from './repositories/interfaces';
import { PromptRepository } from './repositories/prompt-repository';
import { FolderRepository } from './repositories/folder-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { WorkspaceRepository } from './repositories/workspace-repository';
import { initPromptStore } from './stores/prompt-store';
import { initFolderStore } from './stores/folder-store';
import { initAppModeStore } from './stores/app-mode-store';
import { initSettingsStore, useSettingsStore } from './stores/settings-store';
import { initWorkspaceStore } from './stores/workspace-store';
import { seedDefaultPrompts } from './services/seed-data';
import { registerHotkey } from './utils/hotkey';
import { AuthService } from './services/auth-service';
import type { MigrationChoice } from './services/sync-service';
import {
  AppSyncLifecycle,
  restoreAppAuthSession,
  type SyncLifecycleService,
} from './services/app-sync-lifecycle';
import { ConflictService } from './services/conflict-service';
import { initializeAnalyticsTracking } from './services/analytics-service';
import { AppModeProvider } from './contexts/AppModeProvider';
import { AppShell } from './components/app-shell';
import { ErrorBoundary } from './components/shared';
import { applyTheme } from './utils/theme';
import { isTauriRuntime } from './utils/runtime';

// ─── App Initialization ────────────────────────────────────────────────────────

let initialized = false;
let initializationPromise: Promise<void> | null = null;
let syncLifecycleInstance: AppSyncLifecycle | null = null;
let syncServiceInstance: SyncLifecycleService | null = null;
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

/**
 * Determines whether startup should emit an app-open analytics event.
 * Background services are disabled in tests and auxiliary windows to avoid
 * duplicate events from the quick launcher surface.
 */
export function shouldTrackAppOpen(
  enableBackgroundServices: boolean,
  analyticsSurface: AnalyticsSurface,
): boolean {
  return enableBackgroundServices && analyticsSurface === 'main';
}

/** Get the shared ConflictService instance (available after initialization). */
export function getConflictService(): ConflictService | null {
  return conflictServiceInstance;
}

/** Get the shared SyncService instance (available after sync mode activation). */
export function getSyncService(): SyncLifecycleService | null {
  return syncServiceInstance;
}

/** Get the shared AuthService instance (available after initialization). */
export function getAuthService(): AuthService | null {
  return authServiceInstance;
}

/**
 * Idempotently initializes PromptDock's runtime dependencies.
 * Wires storage, repositories, Zustand stores, optional background services,
 * auth restoration, analytics, and the global hotkey; concurrent callers share
 * the same initialization promise.
 */
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

/**
 * Performs the ordered startup sequence after initializeApp has handled
 * singleton guards. Side effects include persistent storage reads/writes,
 * store creation, optional seed data, hotkey registration, and sync wiring.
 */
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
  const workspaceRepo = new WorkspaceRepository(backend);

  // 3. Initialize Zustand stores with real repositories
  const appModeStore = initAppModeStore();
  const promptStore = initPromptStore(promptRepo);
  const folderStore = initFolderStore(folderRepo);
  const settingsStore = initSettingsStore(settingsRepo);
  const workspaceStore = initWorkspaceStore(workspaceRepo);

  // 4. Seed default prompts on first launch
  if (seedDefaultData) {
    await seedDefaultPrompts(promptRepo);
  }

  // 5. Load initial data into stores
  await promptStore.getState().loadPrompts();
  await folderStore.getState().loadFolders();
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

  // 8. Start sync lifecycle orchestration for auth restore and mode changes.
  if (enableBackgroundServices) {
    syncLifecycleInstance = new AppSyncLifecycle({
      appModeStore,
      promptStore,
      folderStore,
      settingsStore,
      workspaceStore,
      promptRepository: promptRepo,
      folderRepository: folderRepo,
      authService: authServiceInstance,
      conflictService: conflictServiceInstance,
      syncMigrationChoice,
      onSyncServiceChange: (service) => {
        syncServiceInstance = service;
      },
    });
    syncLifecycleInstance.start();
  }

  // 9. Restore auth session — if a valid user exists, transition to synced mode
  if (restoreAuthSession) {
    if (syncLifecycleInstance) {
      await syncLifecycleInstance.restoreAuthSession();
    } else {
      await restoreAppAuthSession(authServiceInstance, appModeStore);
    }
  }
}

// ─── Theme Manager ─────────────────────────────────────────────────────────────
// Rendered only after stores are initialised so useSettingsStore is safe to call.

/**
 * Applies the persisted theme setting to the document root.
 * System theme listens for OS preference changes while explicit light/dark modes
 * apply once per setting change.
 */
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
