import { useState, useCallback, useRef, useEffect } from 'react';
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
  onCreateFolder?: (name: string) => void;
  onMoreFolders?: () => void;
  onMoreTags?: () => void;
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
  onCreateFolder,
  onMoreFolders,
  onMoreTags,
}: SidebarProps) {
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderInputValue, setFolderInputValue] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showFolderInput && folderInputRef.current) {
      folderInputRef.current.focus();
    }
  }, [showFolderInput]);

  const handleFolderInputSubmit = useCallback(() => {
    const trimmed = folderInputValue.trim();
    if (trimmed && onCreateFolder) {
      onCreateFolder(trimmed);
    }
    setFolderInputValue('');
    setShowFolderInput(false);
  }, [folderInputValue, onCreateFolder]);

  const handleFolderInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFolderInputSubmit();
      }
      if (e.key === 'Escape') {
        setFolderInputValue('');
        setShowFolderInput(false);
      }
    },
    [handleFolderInputSubmit],
  );

  const handleFolderPlusClick = useCallback(() => {
    setShowFolderInput(true);
  }, []);
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
        <SidebarSection label="FOLDERS" actionIcon={<Plus className="h-3.5 w-3.5" />} onActionClick={handleFolderPlusClick}>
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
          {showFolderInput && (
            <div className="px-2 py-1">
              <input
                ref={folderInputRef}
                type="text"
                value={folderInputValue}
                onChange={(e) => setFolderInputValue(e.target.value)}
                onKeyDown={handleFolderInputKeyDown}
                onBlur={handleFolderInputSubmit}
                placeholder="Folder name"
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm outline-none focus:border-[var(--color-primary)]"
                aria-label="New folder name"
              />
            </div>
          )}
          <button
            type="button"
            onClick={onMoreFolders}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            More…
          </button>
        </SidebarSection>

        {/* ── Tags ──────────────────────────────────────────────────────── */}
        <SidebarSection label="TAGS" actionIcon={<Plus className="h-3.5 w-3.5" />}>
          {Object.entries(tagCounts).map(([tag, count]) => (
            <SidebarItem
              key={tag}
              icon={<Hash className="h-4 w-4" />}
              iconColor="text-[var(--color-text-muted)]"
              label={tag}
              itemKey={`tag-${tag.toLowerCase()}`}
              isActive={activeItem === `tag-${tag.toLowerCase()}`}
              onSelect={onItemSelect}
              count={count}
            />
          ))}
          <button
            type="button"
            onClick={onMoreTags}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            More…
          </button>
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
  onActionClick?: () => void;
}

function SidebarSection({ label, children, actionIcon, onActionClick }: SidebarSectionProps) {
  return (
    <div className="px-3 pt-4 first:pt-2">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        {actionIcon && (
          <button
            type="button"
            onClick={onActionClick}
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
