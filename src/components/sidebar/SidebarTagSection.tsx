import { Hash } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

interface SidebarTagSectionProps {
  activeItem: string;
  onItemSelect: (item: string) => void;
  tagCounts: Record<string, number>;
}

export function SidebarTagSection({
  activeItem,
  onItemSelect,
  tagCounts,
}: SidebarTagSectionProps) {
  return (
    <SidebarSection label="TAGS">
      {Object.entries(tagCounts).map(([tag, count]) => {
        const itemKey = `tag-${tag.toLowerCase()}`;
        return (
          <SidebarItem
            key={tag}
            icon={<Hash className="h-4 w-4" />}
            iconColor="text-[var(--color-text-muted)]"
            label={tag}
            itemKey={itemKey}
            isActive={activeItem === itemKey}
            onSelect={onItemSelect}
            count={count}
          />
        );
      })}
    </SidebarSection>
  );
}
