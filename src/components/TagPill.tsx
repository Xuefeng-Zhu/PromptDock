import { X } from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TagPillProps {
  tag: string;
  onRemove?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Small rounded badge displaying a tag name with an optional remove button.
 * Uses muted background and text colors from the design token system.
 */
export function TagPill({ tag, onRemove }: TagPillProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-[var(--color-primary-light)] text-[var(--color-text-muted)]',
      ].join(' ')}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-gray-200 transition-colors"
          aria-label={`Remove ${tag} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
