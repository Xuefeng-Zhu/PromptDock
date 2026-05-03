import { Sidebar } from '../Sidebar';
import type { Folder, UserSettings } from '../../types/index';

interface AppSidebarProps {
  activeItem: string;
  archivedCount: number;
  favoriteCount: number;
  folders: Folder[];
  onCreateFolder: (name: string) => void;
  onItemSelect: (item: string) => void;
  onSettingsOpen: () => void;
  onToggleTheme: () => void;
  promptCountByFolder: Record<string, number>;
  recentCount: number;
  tagCounts: Record<string, number>;
  theme: UserSettings['theme'];
  totalPromptCount: number;
}

export function AppSidebar({
  activeItem,
  archivedCount,
  favoriteCount,
  folders,
  onCreateFolder,
  onItemSelect,
  onSettingsOpen,
  onToggleTheme,
  promptCountByFolder,
  recentCount,
  tagCounts,
  theme,
  totalPromptCount,
}: AppSidebarProps) {
  return (
    <Sidebar
      folders={folders}
      activeItem={activeItem}
      onItemSelect={onItemSelect}
      promptCountByFolder={promptCountByFolder}
      totalPromptCount={totalPromptCount}
      favoriteCount={favoriteCount}
      recentCount={recentCount}
      archivedCount={archivedCount}
      tagCounts={tagCounts}
      onSettingsOpen={onSettingsOpen}
      onToggleTheme={onToggleTheme}
      onCreateFolder={onCreateFolder}
      theme={theme}
    />
  );
}
