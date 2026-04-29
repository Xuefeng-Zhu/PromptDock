import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { useAppModeStore } from '../stores/app-mode-store';
import { ImportExportService } from '../services/import-export';
import { usePromptStore } from '../stores/prompt-store';

const importExport = new ImportExportService();

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { mode, syncStatus, lastSyncedAt } = useAppModeStore();
  const { prompts, loadPrompts } = usePromptStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleExport = () => {
    const json = importExport.exportToJSON(prompts);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptdock-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const json = ev.target?.result as string;
      const result = importExport.importFromJSON(json);
      if (result.success) {
        alert(`Imported ${result.prompts.length} prompts`);
        await loadPrompts();
      } else {
        alert(`Import failed: ${result.errors.join(', ')}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onBack} className="text-blue-600 hover:underline">← Back</button>
        <h2 className="font-bold">Settings</h2>
        <div />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="font-medium mb-2">Account</h3>
          {mode === 'local' ? (
            <p className="text-sm text-gray-500">Sign in to sync prompts across devices (coming soon)</p>
          ) : (
            <p className="text-sm">Signed in · {syncStatus}</p>
          )}
        </section>

        <section>
          <h3 className="font-medium mb-2">Hotkey</h3>
          <input
            value={settings.hotkeyCombo}
            onChange={(e) => updateSettings({ hotkeyCombo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            aria-label="Hotkey combination"
          />
        </section>

        <section>
          <h3 className="font-medium mb-2">Theme</h3>
          <select
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            aria-label="Theme"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </section>

        <section>
          <h3 className="font-medium mb-2">Default Action</h3>
          <select
            value={settings.defaultAction}
            onChange={(e) => updateSettings({ defaultAction: e.target.value as 'copy' | 'paste' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            aria-label="Default action"
          >
            <option value="copy">Copy to Clipboard</option>
            <option value="paste">Paste into Active App</option>
          </select>
        </section>

        <section>
          <h3 className="font-medium mb-2">Import / Export</h3>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Export</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Import</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </section>

        {lastSyncedAt && (
          <section>
            <h3 className="font-medium mb-2">Sync Status</h3>
            <p className="text-sm text-gray-500">Last synced: {lastSyncedAt.toLocaleString()}</p>
          </section>
        )}
      </div>
    </div>
  );
}
