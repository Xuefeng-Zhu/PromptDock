import { Check } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';
import { PromptCardFooter } from './PromptCardFooter';
import { PromptCardHeader } from './PromptCardHeader';
import { PromptCardTags } from './PromptCardTags';
import { resolveIconFromColor } from './category-icons';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptCardProps {
  prompt: PromptRecipe;
  categoryColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export { formatRelativeTime } from '../../utils/date-format';

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Redesigned prompt card for the library grid.
 *
 * Displays a colored IconTile, title, truncated description, TagPills,
 * relative timestamp, and a favorite star toggle. Supports selected state
 * with a blue border and checkmark indicator, and hover shadow elevation.
 *
 * The `categoryColor` prop is a space-separated Tailwind class string
 * like "bg-purple-100 text-purple-600" applied to the IconTile.
 */
export function PromptCard({
  prompt,
  categoryColor,
  isSelected,
  onSelect,
  onToggleFavorite,
  viewMode = 'grid',
}: PromptCardProps) {
  // Parse the icon name from the categoryColor — the CATEGORY_COLORS data
  // includes an `icon` field, but PromptCard receives only the color string.
  // The parent (PromptGrid) should ideally pass the icon name too, but for now
  // we infer a default icon from the color family.
  const iconNode = resolveIconFromColor(categoryColor);

  const isList = viewMode === 'list';

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      className={[
        'relative rounded-xl border bg-[var(--color-panel)] p-4 cursor-pointer',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
        isList ? 'flex items-center gap-4 shadow-sm hover:shadow' : 'shadow-sm hover:shadow-md',
        isSelected
          ? 'border-[#2563EB] ring-1 ring-[#2563EB]'
          : 'border-[var(--color-border)]',
      ].join(' ')}
      onClick={() => onSelect(prompt.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(prompt.id);
        }
      }}
      data-testid={`prompt-card-${prompt.id}`}
    >
      {/* Selected checkmark indicator */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full bg-[#2563EB] text-white"
          aria-hidden="true"
        >
          <Check className="h-3 w-3" />
        </div>
      )}

      <PromptCardHeader
        categoryColor={categoryColor}
        icon={iconNode}
        isList={isList}
        prompt={prompt}
      />

      {!isList && (
        <PromptCardTags
          tags={prompt.tags}
          className="mt-3 flex flex-wrap gap-1.5"
        />
      )}

      <PromptCardFooter
        favorite={prompt.favorite}
        isList={isList}
        lastUsedAt={prompt.lastUsedAt}
        onToggleFavorite={() => onToggleFavorite(prompt.id)}
      />
    </div>
  );
}
