import { Star, Check, FileText, Pencil, Lightbulb, Code, Mail, ClipboardList } from 'lucide-react';
import type { PromptRecipe } from '../types/index';
import { TagPill } from './TagPill';
import { IconTile } from './IconTile';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptCardProps {
  prompt: PromptRecipe;
  categoryColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

// ─── Icon Mapping ──────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  Pencil: <Pencil className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a Date to a human-readable relative time string.
 * Returns strings like "just now", "2 minutes ago", "3 days ago", "2 weeks ago", etc.
 */
export function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never used';

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Truncates text to a maximum length, appending an ellipsis if truncated.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Resolves a category icon name to a React node.
 * Falls back to FileText if the icon name is not recognized.
 */
function getCategoryIcon(iconName: string): React.ReactNode {
  return CATEGORY_ICON_MAP[iconName] ?? <FileText className="h-4 w-4" />;
}

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
}: PromptCardProps) {
  // Parse the icon name from the categoryColor — the CATEGORY_COLORS data
  // includes an `icon` field, but PromptCard receives only the color string.
  // The parent (PromptGrid) should ideally pass the icon name too, but for now
  // we infer a default icon from the color family.
  const iconNode = resolveIconFromColor(categoryColor);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={[
        'relative rounded-xl border bg-[var(--color-panel)] p-4 cursor-pointer',
        'transition-all duration-200 ease-in-out',
        'shadow-sm hover:shadow-md',
        isSelected
          ? 'border-[#2563EB] ring-1 ring-[#2563EB]'
          : 'border-[var(--color-border)]',
      ].join(' ')}
      onClick={() => onSelect(prompt.id)}
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

      {/* Header: IconTile + Title */}
      <div className="flex items-start gap-3">
        <IconTile icon={iconNode} color={categoryColor} />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-main)] leading-snug truncate">
            {prompt.title}
          </h3>

          {/* Truncated description */}
          {prompt.description && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
              {truncate(prompt.description, 120)}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prompt.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}

      {/* Footer: relative timestamp + favorite star */}
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-placeholder)]">
          {formatRelativeTime(prompt.lastUsedAt)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(prompt.id);
          }}
          className="shrink-0 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={[
              'h-4 w-4 transition-colors',
              prompt.favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-[var(--color-text-placeholder)]',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Resolves a lucide-react icon node from the categoryColor string.
 * Maps known Tailwind color families to their corresponding icons.
 */
function resolveIconFromColor(categoryColor: string): React.ReactNode {
  if (categoryColor.includes('purple')) return getCategoryIcon('FileText');
  if (categoryColor.includes('green')) return getCategoryIcon('Pencil');
  if (categoryColor.includes('amber')) return getCategoryIcon('Lightbulb');
  if (categoryColor.includes('blue')) return getCategoryIcon('Code');
  if (categoryColor.includes('rose')) return getCategoryIcon('Mail');
  if (categoryColor.includes('teal')) return getCategoryIcon('ClipboardList');
  return getCategoryIcon('FileText');
}
