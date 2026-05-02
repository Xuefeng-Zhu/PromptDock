import { useState, useRef, useEffect } from 'react';
import { Star, MoreHorizontal, Copy, Plus, ChevronDown, ChevronRight, Pencil, Files, FolderInput, Archive, Trash2 } from 'lucide-react';
import type { PromptRecipe, Folder } from '../types/index';
import { formatDate, formatRelativeShort } from '../utils/date-format';
import { splitPromptTemplateParts } from '../utils/prompt-template';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptInspectorProps {
  prompt: PromptRecipe;
  folder?: Folder;
  variables: string[];
  onToggleFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopyBody?: (body: string, promptId?: string) => void;
}

/**
 * Renders body text with `{{variable_name}}` highlighted in blue.
 */
function HighlightedBody({ text }: { text: string }) {
  const parts = splitPromptTemplateParts(text);
  return (
    <pre className="whitespace-pre-wrap font-[var(--font-mono)] text-xs leading-relaxed text-[var(--color-text-main)]">
      {parts.map((part, i) =>
        part.isVariable ? (
          <span
            key={i}
            className="text-[var(--color-primary)] font-medium"
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </pre>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PromptInspector({ prompt, folder, variables, onToggleFavorite, onEdit, onDuplicate, onArchive, onDelete, onCopyBody }: PromptInspectorProps) {
  const [variablesExpanded, setVariablesExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    onEdit?.(prompt.id);
    setMenuOpen(false);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <aside
      className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden"
      aria-label="Prompt details"
    >
      <div className="flex-1 overflow-y-auto">
        {/* ── Header: Title + Actions ─────────────────────────────────────── */}
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
              {/* More options dropdown */}
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
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} label="Edit prompt" onClick={handleEdit} />
                    <DropdownItem icon={<Files className="h-4 w-4" />} label="Duplicate" onClick={() => { onDuplicate?.(prompt.id); setMenuOpen(false); }} />
                    <DropdownItem icon={<FolderInput className="h-4 w-4" />} label="Move to folder" onClick={handleEdit} />
                    <DropdownItem icon={<Archive className="h-4 w-4" />} label="Archive" onClick={() => { onArchive?.(prompt.id); setMenuOpen(false); }} />
                    <div className="my-1 border-t border-[var(--color-border)]" />
                    <DropdownItem icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={() => { onDelete?.(prompt.id); setMenuOpen(false); }} danger />
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

        {/* ── Tags ────────────────────────────────────────────────────────── */}
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
              onClick={handleEdit}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ── Metadata ────────────────────────────────────────────────────── */}
        <div className="px-5 pb-4 space-y-2.5">
          <MetadataRow label="Last used" value={formatRelativeShort(prompt.lastUsedAt)} />
          <MetadataRow label="Created" value={formatDate(prompt.createdAt)} />
          <MetadataRow label="Updated" value={formatDate(prompt.updatedAt)} />
          {folder && <MetadataRow label="Folder" value={folder.name} />}
        </div>

        {/* ── Prompt Body ─────────────────────────────────────────────────── */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Prompt
            </h3>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
              aria-label="Copy prompt body"
              onClick={() => onCopyBody?.(prompt.body, prompt.id)}
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 max-h-64 overflow-y-auto">
            <HighlightedBody text={prompt.body} />
          </div>
        </div>

        {/* ── Variables (collapsible) ─────────────────────────────────────── */}
        {variables.length > 0 && (
          <div className="px-5 pb-4">
            <button
              type="button"
              onClick={() => setVariablesExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-[var(--color-text-main)]">
                Variables ({variables.length})
              </span>
              {variablesExpanded ? (
                <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              )}
            </button>
            {variablesExpanded && (
              <div className="mt-2 space-y-2">
                {variables.map((v) => (
                  <div
                    key={v}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  >
                    <span className="text-xs font-mono text-[var(--color-primary)]">{`{{${v}}}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Internal: Dropdown Item ───────────────────────────────────────────────────

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
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

// ─── Internal: Metadata Row ────────────────────────────────────────────────────

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-main)]">{value}</span>
    </div>
  );
}
