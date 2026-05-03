import { Plus } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';

interface PromptTagsSectionProps {
  onEdit?: (id: string) => void;
  prompt: PromptRecipe;
}

export function PromptTagsSection({ onEdit, prompt }: PromptTagsSectionProps) {
  return (
    <div className="px-5 pb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Tags
      </h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {prompt.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]"
          >
            #{tag}
          </span>
        ))}
        <button
          type="button"
          className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          aria-label="Add tag"
          onClick={() => onEdit?.(prompt.id)}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
