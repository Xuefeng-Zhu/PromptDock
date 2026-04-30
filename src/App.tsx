import { useState, useEffect } from 'react';
import { LocalStorageBackend } from './repositories/local-storage-backend';
import { PromptRepository } from './repositories/prompt-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { initPromptStore } from './stores/prompt-store';
import { initAppModeStore } from './stores/app-mode-store';
import { initSettingsStore } from './stores/settings-store';
import { seedDefaultPrompts } from './services/seed-data';
import { AppModeProvider } from './contexts/AppModeProvider';
import { AppShell } from './components/AppShell';

// ─── App Initialization ────────────────────────────────────────────────────────

let initialized = false;

async function initializeApp(): Promise<void> {
  if (initialized) return;

  // 1. Initialize the local storage backend
  const backend = new LocalStorageBackend();
  await backend.initialize();

  // 2. Create repositories
  const promptRepo = new PromptRepository(backend);
  const settingsRepo = new SettingsRepository(backend);

  // 3. Initialize Zustand stores with real repositories
  initAppModeStore();
  const promptStore = initPromptStore(promptRepo);
  const settingsStore = initSettingsStore(settingsRepo);

  // 4. Seed default prompts on first launch
  await seedDefaultPrompts(promptRepo);

  // 5. Load initial data into stores
  await promptStore.getState().loadPrompts();
  await settingsStore.getState().loadSettings();

  initialized = true;
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
        <p className="text-sm text-gray-400">Loading PromptDock…</p>
      </div>
    );
  }

  return (
    <AppModeProvider>
      <AppShell />
    </AppModeProvider>
  );
}

export default App;
