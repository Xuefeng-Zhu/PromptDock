import { Home, FolderOpen, Tag, Layers } from 'lucide-react';
import type { Folder } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  folders: Folder[];
  activeItem: string;
  onItemSelect: (item: string) => void;
  promptCountByFolder: Record<string, number>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Left navigation panel with sections for Library, Folders (with prompt counts),
 * Tags, and Workspaces. Sits below the fixed TopBar (h-14 / 56px).
 */
export function Sidebar({
  folders,
  activeItem,
  onItemSelect,
  promptCountByFolder,
}: SidebarProps) {
  return (
    <nav
      className="flex h-full w-56 flex-col gap-1 overflow-y-auto border-r pt-14 pb-4"
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
      aria-label="Main navigation"
    >
      {/* ── Library section ─────────────────────────────────────────────── */}
      <SidebarSection label="Library">
        <SidebarItem
          icon={<Home className="h-4 w-4" />}
          label="All Prompts"
          itemKey="library"
          isActive={activeItem === 'library'}
          onSelect={onItemSelect}
        />
      </SidebarSection>

      {/* ── Folders section ─────────────────────────────────────────────── */}
      <SidebarSection label="Folders">
        {folders.map((folder) => (
          <SidebarItem
            key={folder.id}
            icon={<FolderOpen className="h-4 w-4" />}
            label={folder.name}
            itemKey={folder.id}
            isActive={activeItem === folder.id}
            onSelect={onItemSelect}
            count={promptCountByFolder[folder.id]}
          />
        ))}
      </SidebarSection>

      {/* ── Tags section (placeholder) ──────────────────────────────────── */}
      <SidebarSection label="Tags">
        <SidebarItem
          icon={<Tag className="h-4 w-4" />}
          label="All Tags"
          itemKey="tags"
          isActive={activeItem === 'tags'}
          onSelect={onItemSelect}
        />
      </SidebarSection>

      {/* ── Workspaces section (placeholder) ────────────────────────────── */}
      <SidebarSection label="Workspaces">
        <SidebarItem
          icon={<Layers className="h-4 w-4" />}
          label="Default"
          itemKey="workspaces"
          isActive={activeItem === 'workspaces'}
          onSelect={onItemSelect}
        />
      </SidebarSection>
    </nav>
  );
}

// ─── Internal: Section ─────────────────────────────────────────────────────────

interface SidebarSectionProps {
  label: string;
  children: React.ReactNode;
}

function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div className="px-3 pt-4 first:pt-3">
      <span
        className="mb-1 block px-2 text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

// ─── Internal: Item ────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  itemKey: string;
  isActive: boolean;
  onSelect: (key: string) => void;
  count?: number;
}

function SidebarItem({
  icon,
  label,
  itemKey,
  isActive,
  onSelect,
  count,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      aria-selected={isActive}
      onClick={() => onSelect(itemKey)}
      className={[
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150',
        isActive
          ? 'bg-[var(--color-primary)]/10 font-medium'
          : 'hover:bg-gray-100',
      ].join(' ')}
      style={{
        color: isActive
          ? 'var(--color-primary)'
          : 'var(--color-text-main)',
      }}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="ml-auto flex-shrink-0 text-xs tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
