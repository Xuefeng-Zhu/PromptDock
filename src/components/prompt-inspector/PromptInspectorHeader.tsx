import { useState } from 'react';
import { Archive, Files, Pencil, Star, Trash2 } from 'lucide-react';
import {
  PromptActionsMenu,
  type PromptActionMenuItem,
} from '../prompt-actions';
import type { PromptRecipe } from '../../types/index';

interface PromptInspectorHeaderProps {
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  prompt: PromptRecipe;
}

export function PromptInspectorHeader({
  onArchive,
  onDelete,
  onRestore,
  onDuplicate,
  onEdit,
  onToggleFavorite,
  prompt,
}: PromptInspectorHeaderProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    onDelete?.(prompt.id);
  };

  const archiveAction: PromptActionMenuItem = prompt.archived
    ? {
        type: 'item',
        icon: <Archive className="h-4 w-4" />,
        label: 'Restore',
        onSelect: () => onRestore?.(prompt.id),
      }
    : {
        type: 'item',
        icon: <Archive className="h-4 w-4" />,
        label: 'Archive',
        onSelect: () => onArchive?.(prompt.id),
      };

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
    archiveAction,
    { type: 'separator' },
    {
      type: 'item',
      danger: true,
      icon: <Trash2 className="h-4 w-4" />,
      label: 'Delete',
      onSelect: handleDeleteRequest,
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

      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="presentation"
        >
          <div
            aria-describedby="delete-prompt-description"
            aria-labelledby="delete-prompt-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
            role="dialog"
          >
            <h3
              className="text-base font-semibold text-[var(--color-text-main)]"
              id="delete-prompt-title"
            >
              Delete "{prompt.title}" permanently?
            </h3>
            <p
              className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]"
              id="delete-prompt-description"
            >
              This cannot be undone. Archive the prompt instead if you might need it later.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
                onClick={handleDeleteCancel}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                onClick={handleDeleteConfirm}
                type="button"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
