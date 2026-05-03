import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, Files, FolderInput, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const runAction = (action?: (id: string) => void) => {
    action?.(prompt.id);
    setMenuOpen(false);
  };

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

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
              aria-label="More options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg"
              >
                <DropdownItem icon={<Pencil className="h-4 w-4" />} label="Edit prompt" onClick={() => runAction(onEdit)} />
                <DropdownItem icon={<Files className="h-4 w-4" />} label="Duplicate" onClick={() => runAction(onDuplicate)} />
                <DropdownItem icon={<FolderInput className="h-4 w-4" />} label="Move to folder" onClick={() => runAction(onEdit)} />
                <DropdownItem icon={<Archive className="h-4 w-4" />} label="Archive" onClick={() => runAction(onArchive)} />
                <div className="my-1 border-t border-[var(--color-border)]" />
                <DropdownItem icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={() => runAction(onDelete)} danger />
              </div>
            )}
          </div>
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

interface DropdownItemProps {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function DropdownItem({
  danger = false,
  icon,
  label,
  onClick,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-[var(--color-text-main)] hover:bg-gray-50',
      ].join(' ')}
    >
      <span className={danger ? 'text-red-500' : 'text-[var(--color-text-muted)]'}>{icon}</span>
      {label}
    </button>
  );
}
