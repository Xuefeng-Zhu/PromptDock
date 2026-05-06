import { X } from 'lucide-react';
import type { Folder, UserSettings } from '../../types/index';
import { SidebarFolderSection } from './SidebarFolderSection';
import { SidebarFooter } from './SidebarFooter';
import { SidebarLibrarySection } from './SidebarLibrarySection';
import { SidebarTagSection } from './SidebarTagSection';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  ariaLabel?: string;
  className?: string;
  folders: Folder[];
  activeItem: string;
  onItemSelect: (item: string) => void;
  promptCountByFolder: Record<string, number>;
  totalPromptCount?: number;
  favoriteCount?: number;
  recentCount?: number;
  archivedCount?: number;
  tagCounts?: Record<string, number>;
  onSettingsOpen?: () => void;
  onToggleTheme?: () => void;
  onCreateFolder?: (name: string) => void;
  onClose?: () => void;
  theme?: UserSettings['theme'];
  variant?: 'desktop' | 'drawer';
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
  ariaLabel = 'Main navigation',
  className = '',
  folders,
  activeItem,
  onItemSelect,
  promptCountByFolder,
  totalPromptCount = 0,
  favoriteCount = 0,
  recentCount = 0,
  archivedCount = 0,
  tagCounts = {},
  onSettingsOpen,
  onToggleTheme,
  onCreateFolder,
  onClose,
  theme = 'system',
  variant = 'desktop',
}: SidebarProps) {
  const isDrawer = variant === 'drawer';

  return (
    <nav
      id={isDrawer ? 'mobile-navigation' : undefined}
      className={[
        'flex h-full flex-col overflow-y-auto',
        isDrawer ? 'w-full' : 'w-56 border-r pt-14',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
      aria-label={ariaLabel}
    >
      {isDrawer && (
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-semibold text-[var(--color-text-main)]">
            PromptDock
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-3">
        <SidebarLibrarySection
          activeItem={activeItem}
          archivedCount={archivedCount}
          favoriteCount={favoriteCount}
          onItemSelect={onItemSelect}
          recentCount={recentCount}
          totalPromptCount={totalPromptCount}
        />
        <SidebarFolderSection
          activeItem={activeItem}
          folders={folders}
          onCreateFolder={onCreateFolder}
          onItemSelect={onItemSelect}
          promptCountByFolder={promptCountByFolder}
        />
        <SidebarTagSection
          activeItem={activeItem}
          onItemSelect={onItemSelect}
          tagCounts={tagCounts}
        />
      </div>

      <SidebarFooter
        onSettingsOpen={onSettingsOpen}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />
    </nav>
  );
}
