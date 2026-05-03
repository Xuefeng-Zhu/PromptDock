import { Search } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';
import { PromptCard } from '../prompt-card';
import { EmptyState } from '../shared';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptGridProps {
  prompts: PromptRecipe[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  categoryColorMap: Record<string, string>;
  viewMode?: 'grid' | 'list';
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Two-column responsive grid of PromptCards. Displays an EmptyState
 * placeholder when the prompts array is empty.
 *
 * The `categoryColorMap` maps prompt IDs to Tailwind class strings
 * (e.g. "bg-purple-100 text-purple-600") used for the card's IconTile.
 */
export function PromptGrid({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onToggleFavorite,
  categoryColorMap,
  viewMode = 'grid',
}: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10" />}
        title="No prompts found"
        description="Try adjusting your search or filters to find what you're looking for."
      />
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
          : 'flex flex-col gap-2'
      }
      role="listbox"
      aria-label="Prompt list"
      data-view-mode={viewMode}
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          categoryColor={categoryColorMap[prompt.id] ?? ''}
          isSelected={prompt.id === selectedPromptId}
          onSelect={onSelectPrompt}
          onToggleFavorite={onToggleFavorite}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
