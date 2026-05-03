import type { ReactNode } from 'react';
import {
  AlertCircle,
  Download,
  Monitor,
  Moon,
  Sun,
  Upload,
} from 'lucide-react';
import { AccountPanel } from '../AccountPanel';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { HotkeyRecorder } from '../ui/HotkeyRecorder';
import { Toggle } from '../ui/Toggle';
import { usePromptImportExport } from '../../hooks/use-prompt-import-export';
import { useAppModeStore } from '../../stores/app-mode-store';
import type { IAuthService } from '../../services/interfaces';
import type { DefaultAction, DensityOption, ThemeOption } from './settings-data';

interface AccountSettingsCardProps {
  authService?: IAuthService;
}

export function AccountSettingsCard({ authService }: AccountSettingsCardProps) {
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const setMode = useAppModeStore((s) => s.setMode);
  const setUserId = useAppModeStore((s) => s.setUserId);

  return (
    <Card padding="lg">
      <AccountPanel
        authService={authService}
        mode={mode}
        userId={userId}
        syncStatus={syncStatus}
        onAuthSuccess={(user) => {
          setUserId(user.uid);
          setMode('synced');
        }}
        onSignOutSuccess={() => {
          setUserId(null);
          setMode('local');
        }}
      />
    </Card>
  );
}

interface AppearanceSettingsCardProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void | Promise<void>;
  density: DensityOption;
  onDensityChange: (density: DensityOption) => void;
}

interface ThemeItem {
  key: ThemeOption;
  icon: ReactNode;
  label: string;
}

const THEME_OPTIONS: ThemeItem[] = [
  { key: 'light', icon: <Sun size={20} />, label: 'Light' },
  { key: 'dark', icon: <Moon size={20} />, label: 'Dark' },
  { key: 'system', icon: <Monitor size={20} />, label: 'System' },
];

export function AppearanceSettingsCard({
  theme,
  onThemeChange,
  density,
  onDensityChange,
}: AppearanceSettingsCardProps) {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Appearance
      </h3>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--color-text-main)]">
          Theme
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const isActive = theme === option.key;
            return (
              <label
                key={option.key}
                className={[
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                  'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)]',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-gray-50',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.key}
                  checked={isActive}
                  onChange={() => onThemeChange(option.key)}
                  className="sr-only"
                />
                <span
                  className={
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {option.icon}
                </span>
                <span
                  className={[
                    'text-xs font-medium',
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-main)]',
                  ].join(' ')}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <p className="mb-3 text-sm font-medium text-[var(--color-text-main)]">
          Density
        </p>
        <Toggle
          checked={density === 'compact'}
          onChange={(checked) =>
            onDensityChange(checked ? 'compact' : 'comfortable')
          }
          label="Compact mode"
        />
      </div>
    </Card>
  );
}

interface HotkeySettingsCardProps {
  hotkey: string;
  onHotkeyChange: (hotkey: string) => boolean | Promise<boolean>;
  error?: string | null;
}

export function HotkeySettingsCard({
  hotkey,
  onHotkeyChange,
  error,
}: HotkeySettingsCardProps) {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Hotkey
      </h3>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        Set the global shortcut that opens PromptDock from anywhere.
      </p>
      <HotkeyRecorder
        value={hotkey}
        onChange={onHotkeyChange}
        error={error}
        ariaLabel="Global hotkey combination"
      />
    </Card>
  );
}

interface DefaultBehaviorSettingsCardProps {
  defaultAction: DefaultAction;
  onDefaultActionChange: (action: DefaultAction) => void | Promise<void>;
}

const DEFAULT_ACTION_OPTIONS: Array<{
  key: DefaultAction;
  label: string;
  description: string;
}> = [
  {
    key: 'copy',
    label: 'Copy to Clipboard',
    description: 'Copy the prompt text to your clipboard.',
  },
  {
    key: 'paste',
    label: 'Paste into Active App',
    description: 'Paste directly into the focused application.',
  },
];

export function DefaultBehaviorSettingsCard({
  defaultAction,
  onDefaultActionChange,
}: DefaultBehaviorSettingsCardProps) {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Default Behavior
      </h3>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--color-text-main)]">
          When selecting a prompt
        </legend>
        <div className="space-y-2">
          {DEFAULT_ACTION_OPTIONS.map((opt) => {
            const isActive = defaultAction === opt.key;
            return (
              <label
                key={opt.key}
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)]',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-gray-50',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="defaultAction"
                  value={opt.key}
                  checked={isActive}
                  onChange={() => onDefaultActionChange(opt.key)}
                  className="mt-0.5"
                />
                <div>
                  <span className="block text-sm font-medium text-[var(--color-text-main)]">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {opt.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}

export function ImportExportSettingsCard() {
  const {
    duplicates,
    importErrors,
    isExporting,
    isImporting,
    successMessage,
    handleExport,
    handleImport,
    handleOverwriteAll,
    handleSkipAll,
  } = usePromptImportExport();

  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Import / Export
      </h3>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        Back up your prompt library or import prompts from a JSON file.
      </p>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Export prompts to JSON file"
        >
          <Upload size={16} className="mr-2" />
          {isExporting ? 'Exporting\u2026' : 'Export'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleImport}
          disabled={isImporting}
          aria-label="Import prompts from JSON file"
        >
          <Download size={16} className="mr-2" />
          {isImporting ? 'Importing\u2026' : 'Import'}
        </Button>
      </div>

      {successMessage && (
        <p role="status" className="mt-3 text-xs text-green-600">
          {successMessage}
        </p>
      )}

      {importErrors.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-xs font-medium text-red-700">Import failed</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {importErrors.map((err) => (
              <li key={err} className="text-xs text-red-600">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {duplicates.length} duplicate(s) found
            </span>
          </div>
          <ul className="mb-3 list-inside list-disc space-y-0.5">
            {duplicates.map((duplicate) => (
              <li key={`${duplicate.incoming.id}-${duplicate.existing.id}-${duplicate.matchedOn}`} className="text-xs text-amber-700">
                &quot;{duplicate.incoming.title}&quot; &mdash; matched on {duplicate.matchedOn}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSkipAll}
              aria-label="Skip duplicates"
            >
              Skip Duplicates
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOverwriteAll}
              aria-label="Overwrite duplicates"
            >
              Overwrite Duplicates
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AboutSettingsCard() {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        About
      </h3>
      <div className="space-y-2 text-sm text-[var(--color-text-main)]">
        <p>
          <span className="font-medium">PromptDock</span>{' '}
          <span className="text-[var(--color-text-muted)]">v0.1.0</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          A desktop prompt recipe manager built with Tauri, React, and TypeScript.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} PromptDock. All rights reserved.
        </p>
      </div>
    </Card>
  );
}
