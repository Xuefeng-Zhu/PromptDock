import { Search } from 'lucide-react';
import type { PromptRecipe } from '../types/index';
import { PromptCard } from './PromptCard';
import { EmptyState } from './EmptyState';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptGridProps {
  prompts: PromptRecipe[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  categoryColorMap: Record<string, string>;
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
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      role="listbox"
      aria-label="Prompt list"
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          categoryColor={categoryColorMap[prompt.id] ?? ''}
          isSelected={prompt.id === selectedPromptId}
          onSelect={onSelectPrompt}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
