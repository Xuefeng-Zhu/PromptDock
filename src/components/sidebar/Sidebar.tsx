import type { Folder, UserSettings } from '../../types/index';
import { SidebarFolderSection } from './SidebarFolderSection';
import { SidebarFooter } from './SidebarFooter';
import { SidebarLibrarySection } from './SidebarLibrarySection';
import { SidebarTagSection } from './SidebarTagSection';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
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
  onCreateFolder?: (name: string) => void | Promise<unknown>;
  theme?: UserSettings['theme'];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
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
  theme = 'system',
}: SidebarProps) {
  return (
    <nav
      className="flex h-full w-56 flex-col overflow-y-auto border-r pt-14"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
      aria-label="Main navigation"
    >
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
