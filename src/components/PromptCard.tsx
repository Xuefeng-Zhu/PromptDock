import { useState } from 'react';
import type { PromptRecipe } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptCardProps {
  prompt: PromptRecipe;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onCopy: (id: string) => void;
  onPaste: (id: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never used';
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Displays a single PromptRecipe as a card with title, description preview,
 * tags, favorite indicator, last-used timestamp, and action buttons.
 */
export function PromptCard({
  prompt,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onArchive,
  onCopy,
  onPaste,
}: PromptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      data-testid={`prompt-card-${prompt.id}`}
    >
      {/* Header row: title + favorite */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 text-left"
          onClick={() => onEdit(prompt.id)}
          aria-label={`Edit ${prompt.title}`}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {prompt.title}
          </h3>
        </button>

        <button
          onClick={() => onToggleFavorite(prompt.id)}
          className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {prompt.favorite ? (
            <span className="text-yellow-500" aria-hidden="true">★</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">☆</span>
          )}
        </button>
      </div>

      {/* Description preview */}
      {prompt.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {truncate(prompt.description, 120)}
        </p>
      )}

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: last used + actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {formatRelativeTime(prompt.lastUsedAt)}
        </span>

        {/* Action buttons — visible on hover or when menu is open */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          style={menuOpen ? { opacity: 1 } : undefined}
        >
          <button
            onClick={() => onCopy(prompt.id)}
            className="rounded p-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Copy prompt"
            title="Copy"
          >
            📋
          </button>
          <button
            onClick={() => onPaste(prompt.id)}
            className="rounded p-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Paste prompt"
            title="Paste"
          >
            📌
          </button>

          {/* More actions menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded p-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="More actions"
              aria-expanded={menuOpen}
              title="More"
            >
              ⋯
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full z-10 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                role="menu"
              >
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => { onEdit(prompt.id); setMenuOpen(false); }}
                >
                  Edit
                </button>
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => { onDuplicate(prompt.id); setMenuOpen(false); }}
                >
                  Duplicate
                </button>
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => { onToggleFavorite(prompt.id); setMenuOpen(false); }}
                >
                  {prompt.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => { onArchive(prompt.id); setMenuOpen(false); }}
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
