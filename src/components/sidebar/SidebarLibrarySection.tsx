import { Archive, Clock, Home, Star } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

interface SidebarLibrarySectionProps {
  activeItem: string;
  archivedCount: number;
  favoriteCount: number;
  onItemSelect: (item: string) => void;
  recentCount: number;
  totalPromptCount: number;
}

export function SidebarLibrarySection({
  activeItem,
  archivedCount,
  favoriteCount,
  onItemSelect,
  recentCount,
  totalPromptCount,
}: SidebarLibrarySectionProps) {
  return (
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
  );
}
