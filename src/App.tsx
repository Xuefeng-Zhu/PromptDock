import { useState, useEffect, useCallback } from 'react';
import { LocalStorageBackend } from './repositories/local-storage-backend';
import { PromptRepository } from './repositories/prompt-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { initPromptStore, usePromptStore } from './stores/prompt-store';
import { initAppModeStore } from './stores/app-mode-store';
import { initSettingsStore } from './stores/settings-store';
import { seedDefaultPrompts } from './services/seed-data';
import { AppModeProvider } from './contexts/AppModeProvider';
import { MainLibraryScreen } from './screens/MainLibraryScreen';
import { PromptEditor } from './screens/PromptEditor';
import { SettingsScreen } from './screens/SettingsScreen';

// ─── App Initialization ────────────────────────────────────────────────────────

type Screen =
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings' };

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

// ─── App Shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const [screen, setScreen] = useState<Screen>({ name: 'library' });
  const loadPrompts = usePromptStore((s) => s.loadPrompts);

  const handleEditPrompt = useCallback((id: string) => {
    setScreen({ name: 'editor', promptId: id });
  }, []);

  const handleNewPrompt = useCallback(() => {
    setScreen({ name: 'editor' });
  }, []);

  const handleBackToLibrary = useCallback(() => {
    // Reload prompts when returning to library to pick up any changes
    void loadPrompts();
    setScreen({ name: 'library' });
  }, [loadPrompts]);

  const handleOpenSettings = useCallback(() => {
    setScreen({ name: 'settings' });
  }, []);

  switch (screen.name) {
    case 'editor':
      return (
        <PromptEditor
          promptId={screen.promptId}
          onSave={handleBackToLibrary}
          onCancel={handleBackToLibrary}
        />
      );
    case 'settings':
      return (
        <SettingsScreen
          onBack={handleBackToLibrary}
        />
      );
    case 'library':
    default:
      return (
        <div className="relative h-screen">
          <MainLibraryScreen
            onEditPrompt={handleEditPrompt}
          />
          {/* Floating action buttons */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <button
              onClick={handleOpenSettings}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 shadow-md transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>
            <button
              onClick={handleNewPrompt}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white shadow-lg transition-colors hover:bg-blue-700"
              aria-label="Create new prompt"
              title="New Prompt"
            >
              +
            </button>
          </div>
        </div>
      );
  }
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
