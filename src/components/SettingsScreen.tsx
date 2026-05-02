import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Palette,
  Keyboard,
  Settings2,
  Download,
  Upload,
  Info,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { HotkeyRecorder } from './ui/HotkeyRecorder';
import { AccountPanel } from './AccountPanel';
import { useSettingsStore } from '../stores/settings-store';
import { useAppModeStore } from '../stores/app-mode-store';
import { usePromptStore } from '../stores/prompt-store';
import { registerHotkey } from '../utils/hotkey';
import { isTauriRuntime } from '../utils/runtime';
import { saveFile, openFile } from '../utils/file-dialog';
import { ImportExportService } from '../services/import-export';
import type { IAuthService } from '../services/interfaces';
import type { UserSettings, DuplicateInfo, PromptRecipe } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SettingsScreenProps {
  onBack: () => void;
  authService?: IAuthService;
  loading?: boolean;
}

// ─── Section IDs ───────────────────────────────────────────────────────────────

type SectionId =
  | 'account-sync'
  | 'appearance'
  | 'hotkey'
  | 'default-behavior'
  | 'import-export'
  | 'about';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'account-sync', label: 'Account & Sync', icon: <User size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'hotkey', label: 'Hotkey', icon: <Keyboard size={18} /> },
  { id: 'default-behavior', label: 'Default Behavior', icon: <Settings2 size={18} /> },
  { id: 'import-export', label: 'Import/Export', icon: <Download size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

// ─── Settings Types ────────────────────────────────────────────────────────────

type ThemeOption = UserSettings['theme'];
type DensityOption = 'comfortable' | 'compact';
type DefaultAction = UserSettings['defaultAction'];

// ─── AccountCard ───────────────────────────────────────────────────────────────

interface AccountCardProps {
  authService?: IAuthService;
}

function AccountCard({ authService }: AccountCardProps) {
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

// ─── AppearanceCard ────────────────────────────────────────────────────────────

interface AppearanceCardProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  density: DensityOption;
  onDensityChange: (density: DensityOption) => void;
}

interface ThemeItem {
  key: ThemeOption;
  icon: React.ReactNode;
  label: string;
}

const THEME_OPTIONS: ThemeItem[] = [
  { key: 'light', icon: <Sun size={20} />, label: 'Light' },
  { key: 'dark', icon: <Moon size={20} />, label: 'Dark' },
  { key: 'system', icon: <Monitor size={20} />, label: 'System' },
];

function AppearanceCard({
  theme,
  onThemeChange,
  density,
  onDensityChange,
}: AppearanceCardProps) {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Appearance
      </h3>

      {/* Theme selection */}
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

      {/* Density control */}
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

// ─── HotkeyCard ────────────────────────────────────────────────────────────────

interface HotkeyCardProps {
  hotkey: string;
  onHotkeyChange: (hotkey: string) => boolean | Promise<boolean>;
  error?: string | null;
}

function HotkeyCard({ hotkey, onHotkeyChange, error }: HotkeyCardProps) {
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

// ─── DefaultBehaviorCard ───────────────────────────────────────────────────────

interface DefaultBehaviorCardProps {
  defaultAction: DefaultAction;
  onDefaultActionChange: (action: DefaultAction) => void;
}

function DefaultBehaviorCard({
  defaultAction,
  onDefaultActionChange,
}: DefaultBehaviorCardProps) {
  const options: { key: DefaultAction; label: string; description: string }[] = [
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
          {options.map((opt) => {
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

// ─── ImportExportCard ──────────────────────────────────────────────────────────

const importExportService = new ImportExportService();

function ImportExportCard() {
  const prompts = usePromptStore((s) => s.prompts);
  const activeWorkspaceId = usePromptStore((s) => s.activeWorkspaceId);
  const createPrompt = usePromptStore((s) => s.createPrompt);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [pendingNonDuplicates, setPendingNonDuplicates] = useState<PromptRecipe[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setImportErrors([]);
    setSuccessMessage(null);
  }, []);

  const targetWorkspaceId = mode !== 'local' && userId ? activeWorkspaceId : 'local';
  const targetCreatedBy = mode !== 'local' && userId ? userId : 'local';

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    clearMessages();
    setIsExporting(true);
    try {
      const json = importExportService.exportToJSON(prompts);
      const timestamp = new Date().toISOString().slice(0, 10);
      const saved = await saveFile(json, `promptdock-export-${timestamp}.json`);
      if (saved) {
        setSuccessMessage('Prompts exported successfully.');
      }
    } catch (err) {
      setImportErrors([
        `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsExporting(false);
    }
  }, [prompts, clearMessages]);

  // ── Import handler ─────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    clearMessages();
    setDuplicates([]);
    setPendingNonDuplicates([]);
    setIsImporting(true);
    try {
      const content = await openFile();
      if (!content) {
        // User cancelled
        return;
      }

      const result = importExportService.importFromJSON(content);
      if (!result.success) {
        setImportErrors(result.errors);
        return;
      }

      // Check for duplicates
      const dupes = importExportService.detectDuplicates(result.prompts, prompts);
      const dupeIncomingIds = new Set(dupes.map((d) => d.incoming.id));
      const nonDuplicates = result.prompts.filter((p) => !dupeIncomingIds.has(p.id));

      if (dupes.length > 0) {
        // Show duplicate resolution UI
        setDuplicates(dupes);
        setPendingNonDuplicates(nonDuplicates);
        return;
      }

      // No duplicates — add all prompts
      for (const p of result.prompts) {
        await createPrompt({
          workspaceId: targetWorkspaceId,
          title: p.title,
          description: p.description,
          body: p.body,
          tags: p.tags,
          folderId: p.folderId,
          favorite: p.favorite,
          archived: p.archived,
          archivedAt: p.archivedAt,
          lastUsedAt: p.lastUsedAt,
          createdBy: targetCreatedBy,
          version: p.version,
        });
      }
      setSuccessMessage(`Imported ${result.prompts.length} prompt(s) successfully.`);
    } catch (err) {
      setImportErrors([
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsImporting(false);
    }
  }, [prompts, createPrompt, clearMessages, targetCreatedBy, targetWorkspaceId]);

  // ── Duplicate resolution: skip all ─────────────────────────────────────────
  const handleSkipAll = useCallback(async () => {
    try {
      // Only import non-duplicate prompts
      for (const p of pendingNonDuplicates) {
        await createPrompt({
          workspaceId: targetWorkspaceId,
          title: p.title,
          description: p.description,
          body: p.body,
          tags: p.tags,
          folderId: p.folderId,
          favorite: p.favorite,
          archived: p.archived,
          archivedAt: p.archivedAt,
          lastUsedAt: p.lastUsedAt,
          createdBy: targetCreatedBy,
          version: p.version,
        });
      }
      const count = pendingNonDuplicates.length;
      setDuplicates([]);
      setPendingNonDuplicates([]);
      setSuccessMessage(
        count > 0
          ? `Imported ${count} prompt(s), skipped ${duplicates.length} duplicate(s).`
          : `Skipped ${duplicates.length} duplicate(s). No new prompts imported.`,
      );
    } catch (err) {
      setImportErrors([
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    }
  }, [pendingNonDuplicates, duplicates.length, createPrompt, targetCreatedBy, targetWorkspaceId]);

  // ── Duplicate resolution: overwrite all ────────────────────────────────────
  const handleOverwriteAll = useCallback(async () => {
    try {
      // Overwrite existing prompts with incoming data
      for (const dupe of duplicates) {
        await updatePrompt(dupe.existing.id, {
          title: dupe.incoming.title,
          description: dupe.incoming.description,
          body: dupe.incoming.body,
          tags: dupe.incoming.tags,
          folderId: dupe.incoming.folderId,
          favorite: dupe.incoming.favorite,
        });
      }
      // Also import non-duplicate prompts
      for (const p of pendingNonDuplicates) {
        await createPrompt({
          workspaceId: targetWorkspaceId,
          title: p.title,
          description: p.description,
          body: p.body,
          tags: p.tags,
          folderId: p.folderId,
          favorite: p.favorite,
          archived: p.archived,
          archivedAt: p.archivedAt,
          lastUsedAt: p.lastUsedAt,
          createdBy: targetCreatedBy,
          version: p.version,
        });
      }
      const total = duplicates.length + pendingNonDuplicates.length;
      setDuplicates([]);
      setPendingNonDuplicates([]);
      setSuccessMessage(`Imported ${total} prompt(s), overwrote ${duplicates.length} duplicate(s).`);
    } catch (err) {
      setImportErrors([
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    }
  }, [duplicates, pendingNonDuplicates, createPrompt, updatePrompt, targetCreatedBy, targetWorkspaceId]);

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
          {isExporting ? 'Exporting…' : 'Export'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleImport}
          disabled={isImporting}
          aria-label="Import prompts from JSON file"
        >
          <Download size={16} className="mr-2" />
          {isImporting ? 'Importing…' : 'Import'}
        </Button>
      </div>

      {/* Success message */}
      {successMessage && (
        <p role="status" className="mt-3 text-xs text-green-600">
          {successMessage}
        </p>
      )}

      {/* Validation errors */}
      {importErrors.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-xs font-medium text-red-700">Import failed</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {importErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-600">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate resolution UI */}
      {duplicates.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {duplicates.length} duplicate(s) found
            </span>
          </div>
          <ul className="mb-3 list-inside list-disc space-y-0.5">
            {duplicates.map((d, i) => (
              <li key={i} className="text-xs text-amber-700">
                &quot;{d.incoming.title}&quot; — matched on {d.matchedOn}
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

// ─── AboutCard ─────────────────────────────────────────────────────────────────

function AboutCard() {
  return (
    <Card padding="lg">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        About
      </h3>
      <div className="space-y-2 text-sm text-[var(--color-text-main)]">
        <p>
          <span className="font-medium">PromptDock</span>{' '}
          <span className="text-[var(--color-text-muted)]">v1.0.0</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          A desktop prompt recipe manager built with Tauri, React, and TypeScript.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} PromptDock. All rights reserved.
        </p>
      </div>
    </Card>
  );
}

// ─── SettingsScreen ────────────────────────────────────────────────────────────

/**
 * Redesigned settings screen with a two-column layout:
 * - Left column: navigation with section links
 * - Right column: setting cards for each section
 *
 * Uses local state for all settings values (mock data, not persisted).
 * Integration points are marked with TODO comments.
 */
export function SettingsScreen({ onBack, authService, loading = false }: SettingsScreenProps) {
  // ── Read settings from SettingsStore ───────────────────────────────────────
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  // ── Density is a UI-only preference not in UserSettings ────────────────────
  const [density, setDensity] = useState<DensityOption>('comfortable');

  const canUseGlobalHotkeys = isTauriRuntime();
  const visibleNavItems = useMemo(
    () =>
      canUseGlobalHotkeys
        ? NAV_ITEMS
        : NAV_ITEMS.filter((item) => item.id !== 'hotkey'),
    [canUseGlobalHotkeys],
  );

  const [activeSection, setActiveSection] = useState<SectionId>('account-sync');

  // ── Hotkey registration error ──────────────────────────────────────────────
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);

  // ── Settings update error (for theme, default action, etc.) ────────────────
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  // ── Handlers that delegate to SettingsStore ────────────────────────────────
  const handleThemeChange = useCallback(
    async (theme: ThemeOption) => {
      setSettingsError(null);
      try {
        await updateSettings({ theme });
      } catch (err) {
        setSettingsError(
          `Failed to save theme: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [updateSettings],
  );

  const handleHotkeyChange = useCallback(
    async (hotkeyCombo: string): Promise<boolean> => {
      setHotkeyError(null);
      try {
        await registerHotkey(hotkeyCombo);
        await updateSettings({ hotkeyCombo });
        return true;
      } catch (err) {
        setHotkeyError(
          `Failed to register hotkey: ${err instanceof Error ? err.message : String(err)}`,
        );
        return false;
      }
    },
    [updateSettings],
  );

  const handleDefaultActionChange = useCallback(
    async (defaultAction: DefaultAction) => {
      setSettingsError(null);
      try {
        await updateSettings({ defaultAction });
      } catch (err) {
        setSettingsError(
          `Failed to save default action: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [updateSettings],
  );

  // ── Section refs for scroll-to behavior ────────────────────────────────────
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    'account-sync': null,
    appearance: null,
    hotkey: null,
    'default-behavior': null,
    'import-export': null,
    about: null,
  });

  const scrollToSection = useCallback((id: SectionId) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    const container = contentScrollRef.current;
    if (el && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = el.getBoundingClientRect().top;
      const targetTop = container.scrollTop + sectionTop - containerTop;

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        container.scrollTop = targetTop;
      }
    }
  }, []);

  const setSectionRef = useCallback(
    (id: SectionId) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return;
    const scrollContainer = container;

    function updateActiveSection() {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      let current: SectionId = 'account-sync';

      for (const item of visibleNavItems) {
        const section = sectionRefs.current[item.id];
        if (!section) continue;
        const offset = section.getBoundingClientRect().top - containerTop;
        if (offset <= 72) {
          current = item.id;
        }
      }

      setActiveSection(current);
    }

    scrollContainer.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', updateActiveSection);
  }, [visibleNavItems]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="mr-1.5" />
          Back
        </Button>
        <h1 className="text-lg font-bold text-[var(--color-text-main)]">
          Settings
        </h1>
      </header>

      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left nav column */}
        <nav
          className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] p-4"
          aria-label="Settings navigation"
        >
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    aria-selected={isActive}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                      isActive
                        ? 'bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)]',
                    ].join(' ')}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right content column */}
        <div
          ref={contentScrollRef}
          className="min-h-0 flex-1 overflow-y-scroll p-6"
          data-testid="settings-scroll-pane"
        >
          {loading ? (
            <div className="mx-auto max-w-2xl space-y-6" aria-label="Loading settings">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
                  data-testid="settings-placeholder"
                >
                  <div className="mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-3">
                    <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Inline settings error */}
            {settingsError && (
              <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <p className="text-xs text-red-600">{settingsError}</p>
              </div>
            )}

            {/* Account & Sync */}
            <section
              ref={setSectionRef('account-sync')}
              id="settings-account-sync"
              aria-label="Account and Sync settings"
              className="scroll-mt-6"
            >
              <AccountCard authService={authService} />
            </section>

            {/* Appearance */}
            <section
              ref={setSectionRef('appearance')}
              id="settings-appearance"
              aria-label="Appearance settings"
              className="scroll-mt-6"
            >
              <AppearanceCard
                theme={settings.theme}
                onThemeChange={handleThemeChange}
                density={density}
                onDensityChange={setDensity}
              />
            </section>

            {canUseGlobalHotkeys && (
              <section
                ref={setSectionRef('hotkey')}
                id="settings-hotkey"
                aria-label="Hotkey settings"
                className="scroll-mt-6"
              >
                <HotkeyCard
                  hotkey={settings.hotkeyCombo}
                  onHotkeyChange={handleHotkeyChange}
                  error={hotkeyError}
                />
              </section>
            )}

            {/* Default Behavior */}
            <section
              ref={setSectionRef('default-behavior')}
              id="settings-default-behavior"
              aria-label="Default behavior settings"
              className="scroll-mt-6"
            >
              <DefaultBehaviorCard
                defaultAction={settings.defaultAction}
                onDefaultActionChange={handleDefaultActionChange}
              />
            </section>

            {/* Import/Export */}
            <section
              ref={setSectionRef('import-export')}
              id="settings-import-export"
              aria-label="Import and export settings"
              className="scroll-mt-6"
            >
              <ImportExportCard />
            </section>

            {/* About */}
            <section
              ref={setSectionRef('about')}
              id="settings-about"
              aria-label="About PromptDock"
              className="scroll-mt-6"
            >
              <AboutCard />
            </section>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
