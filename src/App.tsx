import { useState, useEffect } from 'react';
import { LocalStorageBackend } from './repositories/local-storage-backend';
import { BrowserStorageBackend } from './repositories/browser-storage-backend';
import type { IStorageBackend } from './repositories/interfaces';
import { PromptRepository } from './repositories/prompt-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { initPromptStore } from './stores/prompt-store';
import { initAppModeStore } from './stores/app-mode-store';
import { initSettingsStore, useSettingsStore } from './stores/settings-store';
import { seedDefaultPrompts } from './services/seed-data';
import { registerHotkey } from './utils/hotkey';
import { AuthService } from './services/auth-service';
import { SyncService } from './services/sync-service';
import { ConflictService } from './services/conflict-service';
import { AppModeProvider } from './contexts/AppModeProvider';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyTheme } from './utils/theme';

// ─── App Initialization ────────────────────────────────────────────────────────

let initialized = false;
let syncServiceInstance: SyncService | null = null;
let conflictServiceInstance: ConflictService | null = null;
let promptRepoInstance: PromptRepository | null = null;

/** Get the shared ConflictService instance (available after initialization). */
export function getConflictService(): ConflictService | null {
  return conflictServiceInstance;
}

/** Get the shared SyncService instance (available after sync mode activation). */
export function getSyncService(): SyncService | null {
  return syncServiceInstance;
}

async function initializeApp(): Promise<void> {
  if (initialized) return;

  // 1. Pick the right storage backend based on runtime environment
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  let backend: IStorageBackend;
  if (isTauri) {
    backend = new LocalStorageBackend();
  } else {
    backend = new BrowserStorageBackend();
  }
  await backend.initialize();

  // 2. Create repositories
  const promptRepo = new PromptRepository(backend);
  const settingsRepo = new SettingsRepository(backend);
  promptRepoInstance = promptRepo;

  // 3. Initialize Zustand stores with real repositories
  const appModeStore = initAppModeStore();
  const promptStore = initPromptStore(promptRepo);
  const settingsStore = initSettingsStore(settingsRepo);

  // 4. Seed default prompts on first launch
  await seedDefaultPrompts(promptRepo);

  // 5. Load initial data into stores
  await promptStore.getState().loadPrompts();
  await settingsStore.getState().loadSettings();

  // 6. Register global hotkey from settings (best-effort — ignore failures at startup)
  try {
    const { hotkeyCombo } = settingsStore.getState().settings;
    await registerHotkey(hotkeyCombo);
  } catch {
    // Hotkey registration may fail outside Tauri or if the combo is invalid.
    // The user can re-register from SettingsScreen.
  }

  // 7. Create ConflictService (shared instance)
  conflictServiceInstance = new ConflictService();

  // 8. Subscribe to AppModeStore mode changes to instantiate/teardown SyncService
  appModeStore.subscribe((state, prevState) => {
    const modeChanged = state.mode !== prevState.mode;
    if (!modeChanged) return;

    if (state.mode === 'synced' && !syncServiceInstance) {
      // Instantiate SyncService when transitioning to synced mode
      syncServiceInstance = new SyncService({
        appModeStore: appModeStore.getState(),
        onRemotePromptsChanged: (prompts) => {
          // 7.2: Update PromptStore with remote prompt list
          promptStore.setState({ prompts });
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
      }
    } else if (state.mode === 'local' && syncServiceInstance) {
      // Teardown SyncService when transitioning back to local mode
      syncServiceInstance.dispose();
      syncServiceInstance = null;
      // Revert PromptRepository to local-only mode
      promptRepo.setFirestoreDelegate(null);
    }
  });

  // 9. Restore auth session — if a valid user exists, transition to synced mode
  try {
    const authService = new AuthService();
    const result = await authService.restoreSession();
    if (result && result.success) {
      const appMode = appModeStore.getState();
      appMode.setUserId(result.user.uid);
      appMode.setMode('synced');

      // After mode transition, instantiate SyncService and start sync
      if (!syncServiceInstance) {
        syncServiceInstance = new SyncService({
          appModeStore: appModeStore.getState(),
          onRemotePromptsChanged: (prompts) => {
            promptStore.setState({ prompts });
          },
          onConflictDetected: (local, remote) => {
            conflictServiceInstance?.processConflict(local, remote);
          },
        });
      }

      // Start the sync transition with the user's workspace
      const workspaceId = result.user.uid; // default workspace = user ID
      const currentPrompts = promptStore.getState().prompts;
      await syncServiceInstance.transitionToSynced(
        result.user.uid,
        workspaceId,
        currentPrompts,
        'migrate',
      );

      // Wire PromptRepository to FirestoreBackend
      const firestoreBackend = syncServiceInstance.getFirestoreBackend();
      if (firestoreBackend) {
        promptRepo.setFirestoreDelegate(firestoreBackend);
      }
    }
  } catch {
    // Session restore failure is non-fatal — stay in local mode
  }

  initialized = true;
}

// ─── Theme Manager ─────────────────────────────────────────────────────────────
// Rendered only after stores are initialised so useSettingsStore is safe to call.

function ThemeManager() {
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
        <AppShell />
      </ErrorBoundary>
    </AppModeProvider>
  );
}

export default App;
