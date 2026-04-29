import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { useAppModeStore } from '../stores/app-mode-store';
import type { UserSettings } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SettingsScreenProps {
  /** Called when the user navigates back from settings. */
  onBack?: () => void;
  /** Called when the user triggers an export. */
  onExport?: () => void;
  /** Called when the user triggers an import. */
  onImport?: () => void;
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── AccountSection ────────────────────────────────────────────────────────────

function AccountSection() {
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);

  // Placeholder sign-in / sign-up form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Wire to AuthService when Firebase is integrated
  };

  if (mode !== 'local' && userId) {
    // Signed-in state
    return (
      <Section title="Account">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Signed in as <span className="font-medium">{userId}</span>
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </Section>
    );
  }

  // Local Mode — show sign-in / sign-up forms
  return (
    <Section title="Account">
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Sign in to sync your prompts across devices.
      </p>
      <form onSubmit={handleAuthSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="settings-email"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label
            htmlFor="settings-password"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="settings-password"
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            required
            aria-required="true"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp((prev) => !prev)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </Section>
  );
}

// ─── HotkeyConfig ──────────────────────────────────────────────────────────────

function HotkeyConfig() {
  const hotkeyCombo = useSettingsStore((s) => s.settings.hotkeyCombo);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    void updateSettings({ hotkeyCombo: e.target.value });
  };

  return (
    <Section title="Global Hotkey">
      <label
        htmlFor="hotkey-input"
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Key combination
      </label>
      <input
        id="hotkey-input"
        type="text"
        value={hotkeyCombo}
        onChange={handleChange}
        placeholder="CommandOrControl+Shift+P"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        aria-describedby="hotkey-hint"
      />
      <p id="hotkey-hint" className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Use modifier keys like CommandOrControl, Shift, Alt combined with a letter or key.
      </p>
    </Section>
  );
}

// ─── ThemeSelector ─────────────────────────────────────────────────────────────

function ThemeSelector() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const options: { value: UserSettings['theme']; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <Section title="Theme">
      <fieldset>
        <legend className="sr-only">Theme preference</legend>
        <div className="flex gap-3">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => void updateSettings({ theme: opt.value })}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </Section>
  );
}

// ─── DefaultActionSelector ─────────────────────────────────────────────────────

function DefaultActionSelector() {
  const defaultAction = useSettingsStore((s) => s.settings.defaultAction);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const options: { value: UserSettings['defaultAction']; label: string; description: string }[] = [
    { value: 'copy', label: 'Copy to Clipboard', description: 'Copy the prompt text to your clipboard' },
    { value: 'paste', label: 'Paste into Active App', description: 'Paste directly into the focused application' },
  ];

  return (
    <Section title="Default Action">
      <fieldset>
        <legend className="sr-only">Default action when selecting a prompt</legend>
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                defaultAction === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="radio"
                name="defaultAction"
                value={opt.value}
                checked={defaultAction === opt.value}
                onChange={() => void updateSettings({ defaultAction: opt.value })}
                className="mt-0.5"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {opt.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </Section>
  );
}

// ─── ImportExportSection ───────────────────────────────────────────────────────

function ImportExportSection({
  onExport,
  onImport,
}: {
  onExport?: () => void;
  onImport?: () => void;
}) {
  return (
    <Section title="Import & Export">
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Back up your prompt library or import prompts from a JSON file.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Export prompts to JSON file"
        >
          Export
        </button>
        <button
          type="button"
          onClick={onImport}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Import prompts from JSON file"
        >
          Import
        </button>
      </div>
    </Section>
  );
}

// ─── SyncStatusSection ─────────────────────────────────────────────────────────

function SyncStatusSection() {
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const lastSyncedAt = useAppModeStore((s) => s.lastSyncedAt);

  const statusLabels: Record<string, { label: string; color: string }> = {
    local: { label: 'Local', color: 'text-gray-500' },
    synced: { label: 'Synced', color: 'text-green-600 dark:text-green-400' },
    syncing: { label: 'Syncing…', color: 'text-blue-600 dark:text-blue-400' },
    offline: { label: 'Offline', color: 'text-yellow-600 dark:text-yellow-400' },
    'pending-changes': { label: 'Pending Changes', color: 'text-orange-600 dark:text-orange-400' },
  };

  const status = statusLabels[syncStatus] ?? statusLabels.local;

  return (
    <Section title="Sync Status">
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
        {lastSyncedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Last synced: {lastSyncedAt.toLocaleString()}
          </span>
        )}
      </div>
    </Section>
  );
}

// ─── WorkspaceSwitcher ─────────────────────────────────────────────────────────

function WorkspaceSwitcher() {
  const mode = useAppModeStore((s) => s.mode);
  const activeWorkspaceId = useSettingsStore((s) => s.settings.activeWorkspaceId);

  // Only visible in Synced Mode
  if (mode === 'local') return null;

  return (
    <Section title="Workspace">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Active workspace: <span className="font-medium">{activeWorkspaceId}</span>
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Workspace switching will be available when sync is configured.
      </p>
    </Section>
  );
}

// ─── SettingsScreen ────────────────────────────────────────────────────────────

/**
 * Settings Screen — allows the user to configure application preferences.
 *
 * Sections:
 * - AccountSection: sign-in/sign-up forms or account info
 * - HotkeyConfig: global hotkey configuration
 * - ThemeSelector: light, dark, system
 * - DefaultActionSelector: copy or paste
 * - ImportExportSection: import/export buttons
 * - SyncStatusSection: sync status and last synced timestamp
 * - WorkspaceSwitcher: visible only in Synced Mode
 */
export function SettingsScreen({ onBack, onExport, onImport }: SettingsScreenProps) {
  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            Back
          </button>
        )}
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-5">
          <AccountSection />
          <HotkeyConfig />
          <ThemeSelector />
          <DefaultActionSelector />
          <ImportExportSection onExport={onExport} onImport={onImport} />
          <SyncStatusSection />
          <WorkspaceSwitcher />
        </div>
      </div>
    </div>
  );
}
