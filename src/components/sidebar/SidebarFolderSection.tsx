import { FolderOpen, Plus } from 'lucide-react';
import type { Folder } from '../../types/index';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { useInlineFolderCreate } from './use-inline-folder-create';

interface SidebarFolderSectionProps {
  activeItem: string;
  folders: Folder[];
  onCreateFolder?: (name: string) => void | Promise<unknown>;
  onItemSelect: (item: string) => void;
  promptCountByFolder: Record<string, number>;
}

export function SidebarFolderSection({
  activeItem,
  folders,
  onCreateFolder,
  onItemSelect,
  promptCountByFolder,
}: SidebarFolderSectionProps) {
  const folderCreate = useInlineFolderCreate(onCreateFolder);

  return (
    <SidebarSection
      label="FOLDERS"
      actionIcon={<Plus className="h-3.5 w-3.5" />}
      onActionClick={() => folderCreate.setShowFolderInput(true)}
    >
      {folders.map((folder) => (
        <SidebarItem
          key={folder.id}
          icon={<FolderOpen className="h-4 w-4" />}
          iconColor="text-[var(--color-text-muted)]"
          label={folder.name}
          itemKey={folder.id}
          isActive={activeItem === folder.id}
          onSelect={onItemSelect}
          count={promptCountByFolder[folder.id]}
        />
      ))}
      {folderCreate.showFolderInput && (
        <div className="px-2 py-1">
          <input
            ref={folderCreate.folderInputRef}
            type="text"
            value={folderCreate.folderInputValue}
            onChange={(event) => folderCreate.setFolderInputValue(event.target.value)}
            onKeyDown={folderCreate.handleFolderInputKeyDown}
            onBlur={folderCreate.submitFolderInput}
            placeholder="Folder name"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)]"
            aria-label="New folder name"
          />
        </div>
      )}
    </SidebarSection>
  );
}
