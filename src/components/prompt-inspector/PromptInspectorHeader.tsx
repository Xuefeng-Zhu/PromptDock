import { Archive, Files, FolderInput, Pencil, Star, Trash2 } from 'lucide-react';
import {
  PromptActionsMenu,
  type PromptActionMenuItem,
} from '../prompt-actions';
import type { PromptRecipe } from '../../types/index';

interface PromptInspectorHeaderProps {
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  prompt: PromptRecipe;
}

export function PromptInspectorHeader({
  onArchive,
  onDelete,
  onDuplicate,
  onEdit,
  onToggleFavorite,
  prompt,
}: PromptInspectorHeaderProps) {
  const actionItems: PromptActionMenuItem[] = [
    {
      type: 'item',
      icon: <Pencil className="h-4 w-4" />,
      label: 'Edit prompt',
      onSelect: () => onEdit?.(prompt.id),
    },
    {
      type: 'item',
      icon: <Files className="h-4 w-4" />,
      label: 'Duplicate',
      onSelect: () => onDuplicate?.(prompt.id),
    },
    {
      type: 'item',
      icon: <FolderInput className="h-4 w-4" />,
      label: 'Move to folder',
      onSelect: () => onEdit?.(prompt.id),
    },
    {
      type: 'item',
      icon: <Archive className="h-4 w-4" />,
      label: 'Archive',
      onSelect: () => onArchive?.(prompt.id),
    },
    { type: 'separator' },
    {
      type: 'item',
      danger: true,
      icon: <Trash2 className="h-4 w-4" />,
      label: 'Delete',
      onSelect: () => onDelete?.(prompt.id),
    },
  ];

  return (
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="text-base font-semibold text-[var(--color-text-main)] leading-snug">
          {prompt.title}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => onToggleFavorite?.(prompt.id)}
          >
            <Star
              className={[
                'h-4 w-4',
                prompt.favorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-[var(--color-text-placeholder)]',
              ].join(' ')}
            />
          </button>

          <PromptActionsMenu items={actionItems} />
        </div>
      </div>
      {prompt.description && (
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {prompt.description}
        </p>
      )}
    </div>
  );
}
