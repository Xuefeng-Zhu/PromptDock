import { Moon, Settings, Sun } from 'lucide-react';
import type { UserSettings } from '../../types/index';

interface SidebarFooterProps {
  onSettingsOpen?: () => void;
  onToggleTheme?: () => void;
  theme: UserSettings['theme'];
}

export function SidebarFooter({
  onSettingsOpen,
  onToggleTheme,
  theme,
}: SidebarFooterProps) {
  return (
    <div
      className="flex items-center justify-between border-t px-3 py-2"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        type="button"
        onClick={onSettingsOpen}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
        <kbd className="text-[10px] font-mono text-[var(--color-text-placeholder)]">⌘,</kbd>
      </button>

      <button
        type="button"
        onClick={onToggleTheme}
        className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
