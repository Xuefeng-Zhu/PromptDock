import {
  Home,
  Star,
  Clock,
  Archive,
  FolderOpen,
  Hash,
  Plus,
  Settings,
  Moon,
} from 'lucide-react';
import type { Folder } from '../types/index';

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
}

// ─── Tag Data (mock) ───────────────────────────────────────────────────────────

const MOCK_TAGS = [
  { name: 'Writing', count: 34 },
  { name: 'Summarization', count: 16 },
  { name: 'Ideation', count: 14 },
  { name: 'Email', count: 12 },
  { name: 'Code', count: 20 },
];

// ─── Workspace Data (mock) ─────────────────────────────────────────────────────

const MOCK_WORKSPACES = [
  { id: 'personal', name: 'Personal', subtitle: 'Default', color: 'bg-purple-500' },
  { id: 'team', name: 'Team Workspace', subtitle: 'Invite only', color: 'bg-teal-500' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
  folders,
  activeItem,
  onItemSelect,
  promptCountByFolder,
  totalPromptCount = 124,
  favoriteCount = 12,
  recentCount = 24,
  archivedCount = 8,
  onSettingsOpen,
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
        {/* ── Library ───────────────────────────────────────────────────── */}
        <SidebarSection label="LIBRARY">
          <SidebarItem
            icon={<Home className="h-4 w-4" />}
            iconColor="text-[var(--color-primary)]"
            label="All Prompts"
            itemKey="library"
            isActive={activeItem === 'library'}
            onSelect={onItemSelect}
            count={totalPromptCount}
          />
          <SidebarItem
            icon={<Star className="h-4 w-4" />}
            iconColor="text-amber-500"
            label="Favorites"
            itemKey="favorites"
            isActive={activeItem === 'favorites'}
            onSelect={onItemSelect}
            count={favoriteCount}
          />
          <SidebarItem
            icon={<Clock className="h-4 w-4" />}
            iconColor="text-green-500"
            label="Recent"
            itemKey="recent"
            isActive={activeItem === 'recent'}
            onSelect={onItemSelect}
            count={recentCount}
          />
          <SidebarItem
            icon={<Archive className="h-4 w-4" />}
            iconColor="text-[var(--color-text-muted)]"
            label="Archived"
            itemKey="archived"
            isActive={activeItem === 'archived'}
            onSelect={onItemSelect}
            count={archivedCount}
          />
        </SidebarSection>

        {/* ── Folders ───────────────────────────────────────────────────── */}
        <SidebarSection label="FOLDERS" actionIcon={<Plus className="h-3.5 w-3.5" />}>
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
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            More…
          </button>
        </SidebarSection>

        {/* ── Tags ──────────────────────────────────────────────────────── */}
        <SidebarSection label="TAGS" actionIcon={<Plus className="h-3.5 w-3.5" />}>
          {MOCK_TAGS.map((tag) => (
            <SidebarItem
              key={tag.name}
              icon={<Hash className="h-4 w-4" />}
              iconColor="text-[var(--color-text-muted)]"
              label={tag.name}
              itemKey={`tag-${tag.name.toLowerCase()}`}
              isActive={activeItem === `tag-${tag.name.toLowerCase()}`}
              onSelect={onItemSelect}
              count={tag.count}
            />
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            More…
          </button>
        </SidebarSection>

        {/* ── Workspaces ────────────────────────────────────────────────── */}
        <SidebarSection label="WORKSPACES" actionIcon={<Plus className="h-3.5 w-3.5" />}>
          {MOCK_WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              type="button"
              aria-selected={activeItem === ws.id}
              onClick={() => onItemSelect(ws.id)}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150',
                activeItem === ws.id
                  ? 'bg-[var(--color-primary)]/10 font-medium'
                  : 'hover:bg-gray-100',
              ].join(' ')}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${ws.color}`}
              >
                {ws.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--color-text-main)]">{ws.name}</p>
                <p className="truncate text-[10px] text-[var(--color-text-muted)]">{ws.subtitle}</p>
              </div>
            </button>
          ))}
        </SidebarSection>
      </div>

      {/* ── Bottom Toolbar ──────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-t px-3 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Settings with shortcut hint */}
        <button
          type="button"
          onClick={onSettingsOpen}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
          <kbd className="text-[10px] font-mono text-[var(--color-text-placeholder)]">⌘,</kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
          aria-label="Toggle dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

// ─── Internal: Section ─────────────────────────────────────────────────────────

interface SidebarSectionProps {
  label: string;
  children: React.ReactNode;
  actionIcon?: React.ReactNode;
}

function SidebarSection({ label, children, actionIcon }: SidebarSectionProps) {
  return (
    <div className="px-3 pt-4 first:pt-2">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        {actionIcon && (
          <button
            type="button"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label={`Add ${label.toLowerCase()}`}
          >
            {actionIcon}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

// ─── Internal: Item ────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  itemKey: string;
  isActive: boolean;
  onSelect: (key: string) => void;
  count?: number;
}

function SidebarItem({
  icon,
  iconColor = '',
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
          ? 'bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]'
          : 'text-[var(--color-text-main)] hover:bg-gray-100',
      ].join(' ')}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-[var(--color-primary)]' : iconColor}`} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="flex-shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
          {count}
        </span>
      )}
    </button>
  );
}
