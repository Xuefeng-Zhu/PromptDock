import { Folder as FolderIcon, Calendar, Clock } from 'lucide-react';
import type { PromptRecipe, Folder } from '../types/index';
import { VariableList } from './VariableList';
import { TagPill } from './TagPill';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptInspectorProps {
  prompt: PromptRecipe;
  folder?: Folder;
  variables: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a Date to a short locale string (e.g. "Dec 20, 2024").
 */
function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Right-side inspector panel for a selected prompt. Displays the full
 * title, description, metadata (folder, tags, created date, last used
 * date), a scrollable body preview, and a VariableList.
 *
 * Uses design token CSS custom properties for consistent styling.
 */
export function PromptInspector({ prompt, folder, variables }: PromptInspectorProps) {
  return (
    <aside
      className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden"
      aria-label="Prompt details"
    >
      {/* Header: Title + Description */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text-main)] leading-snug">
          {prompt.title}
        </h2>
        {prompt.description && (
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
            {prompt.description}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] space-y-3">
        {/* Folder */}
        {folder && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <FolderIcon className="h-4 w-4 shrink-0" />
            <span>{folder.name}</span>
          </div>
        )}

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Created date */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Created {formatDate(prompt.createdAt)}</span>
        </div>

        {/* Last used date */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Last used {formatDate(prompt.lastUsedAt)}</span>
        </div>
      </div>

      {/* Scrollable body preview */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          Body Preview
        </h3>
        <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-main)] font-[var(--font-mono)] leading-relaxed bg-[var(--color-background)] rounded-lg p-3 border border-[var(--color-border)]">
          {prompt.body}
        </pre>
      </div>

      {/* Variable list */}
      {variables.length > 0 && (
        <div className="px-5 py-4 border-t border-[var(--color-border)]">
          <VariableList variables={variables} />
        </div>
      )}
    </aside>
  );
}
