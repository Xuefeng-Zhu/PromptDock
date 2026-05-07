import { FolderOpen, Trash2 } from 'lucide-react';
import type { Folder } from '../../types/index';

interface SidebarFolderItemProps {
  count?: number;
  folder: Folder;
  isActive: boolean;
  onDeleteFolder?: (folder: Folder) => void | Promise<unknown>;
  onItemSelect: (item: string) => void;
}

export function SidebarFolderItem({
  count,
  folder,
  isActive,
  onDeleteFolder,
  onItemSelect,
}: SidebarFolderItemProps) {
  return (
    <div
      className={[
        'group relative flex min-h-10 w-full items-center gap-1 rounded-lg text-sm transition-colors duration-150 md:min-h-0',
        isActive
          ? 'bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]'
          : 'text-[var(--color-text-main)] hover:bg-gray-100',
      ].join(' ')}
    >
      <button
        type="button"
        aria-selected={isActive}
        onClick={() => onItemSelect(folder.id)}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left md:py-1.5"
      >
        <span
          className={`flex-shrink-0 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
          aria-hidden="true"
        >
          <FolderOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        {count !== undefined && count > 0 && (
          <span className="flex-shrink-0 text-xs tabular-nums text-[var(--color-text-muted)] transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
            {count}
          </span>
        )}
      </button>
      {onDeleteFolder && (
        <button
          type="button"
          aria-label={`Delete ${folder.name} folder`}
          title={`Delete ${folder.name}`}
          onClick={() => {
            void onDeleteFolder(folder);
          }}
          className="pointer-events-none absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-text-muted)] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 md:h-7 md:w-7"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
