import type { PromptRecipe } from '../types';

interface Props {
  prompt: PromptRecipe;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
}

export function PromptCard({ prompt, onSelect, onEdit, onDuplicate, onToggleFavorite, onArchive }: Props) {
  return (
    <div
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      onClick={() => onSelect(prompt.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(prompt.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{prompt.title}</h3>
            {prompt.favorite && <span aria-label="Favorite">⭐</span>}
          </div>
          {prompt.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{prompt.description}</p>
          )}
          {prompt.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {prompt.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(prompt.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Edit" aria-label="Edit prompt">✏️</button>
          <button onClick={() => onDuplicate(prompt.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Duplicate" aria-label="Duplicate prompt">📋</button>
          <button onClick={() => onToggleFavorite(prompt.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Favorite" aria-label="Toggle favorite">{prompt.favorite ? '💛' : '🤍'}</button>
          <button onClick={() => onArchive(prompt.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Archive" aria-label="Archive prompt">🗑️</button>
        </div>
      </div>
    </div>
  );
}
