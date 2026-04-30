import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Lightbulb, Save, X } from 'lucide-react';
import type { PromptRecipe, Folder } from '../types/index';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { TagPill } from './TagPill';
import { VariableList } from './VariableList';

// ─── Helper Functions (exported for testability) ───────────────────────────────

/**
 * Extract unique variable names from `{{variable_name}}` placeholders
 * in first-appearance order.
 */
export function extractVariables(body: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/**
 * Count non-empty tokens from whitespace split.
 * Empty string returns 0.
 */
export function countWords(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\s+/).filter((t) => t.length > 0).length;
}

/**
 * Return string.length. Empty string returns 0.
 */
export function countChars(text: string): number {
  return text.length;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptEditorProps {
  promptId?: string;
  prompt?: PromptRecipe;
  folders: Folder[];
  onSave: (data: Partial<PromptRecipe>) => void;
  onCancel: () => void;
}

// ─── Body Highlighting Helper ──────────────────────────────────────────────────

/**
 * Renders body text with `{{variable_name}}` highlighted in blue.
 */
function HighlightedBody({ text }: { text: string }) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <div className="whitespace-pre-wrap font-[var(--font-mono)] text-sm text-[var(--color-text-main)]">
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span
            key={i}
            className="rounded px-1 py-0.5 text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

/**
 * Renders body text with variable placeholders replaced by sample values.
 */
function PreviewBody({ text, variables }: { text: string; variables: string[] }) {
  if (!text) {
    return (
      <p className="text-sm text-[var(--color-text-placeholder)] italic">
        Start typing in the body editor to see a live preview…
      </p>
    );
  }

  let rendered = text;
  for (const v of variables) {
    rendered = rendered.replaceAll(`{{${v}}}`, `[${v}]`);
  }

  return (
    <div className="whitespace-pre-wrap font-[var(--font-mono)] text-sm text-[var(--color-text-main)]">
      {rendered}
    </div>
  );
}

// ─── Line Numbers Helper ───────────────────────────────────────────────────────

function LineNumbers({ count }: { count: number }) {
  return (
    <div
      className="select-none pr-3 text-right font-[var(--font-mono)] text-xs leading-[1.625rem] text-[var(--color-text-placeholder)]"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i + 1}>{i + 1}</div>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Redesigned Prompt Editor with two-column layout:
 * - Left: form fields (title, description, tags, folder, favorite, body editor)
 * - Right: live preview panel (rendered body, detected variables, tips)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */
export function PromptEditor({
  promptId,
  prompt,
  folders,
  onSave,
  onCancel,
}: PromptEditorProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [body, setBody] = useState(prompt?.body ?? '');
  const [tags, setTags] = useState<string[]>(prompt?.tags ? [...prompt.tags] : []);
  const [folderId, setFolderId] = useState<string | null>(prompt?.folderId ?? null);
  const [favorite, setFavorite] = useState(prompt?.favorite ?? false);
  const [tagInput, setTagInput] = useState('');

  // ── Populate fields when prompt prop changes ───────────────────────────────
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description);
      setBody(prompt.body);
      setTags([...prompt.tags]);
      setFolderId(prompt.folderId);
      setFavorite(prompt.favorite);
    }
  }, [prompt]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const variables = useMemo(() => extractVariables(body), [body]);
  const wordCount = useMemo(() => countWords(body), [body]);
  const charCount = useMemo(() => countChars(body), [body]);
  const lineCount = useMemo(() => Math.max(body.split('\n').length, 1), [body]);

  const isEditing = Boolean(promptId);

  // ── Tag management ─────────────────────────────────────────────────────────
  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag],
  );

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // TODO: replace with repository call for backend persistence
    onSave({
      title: title.trim(),
      description: description.trim(),
      body,
      tags,
      folderId,
      favorite,
    });
  }, [onSave, title, description, body, tags, folderId, favorite]);

  // ── Folder options for Select ──────────────────────────────────────────────
  const folderOptions = useMemo(
    () => [
      { value: '', label: 'No folder' },
      ...folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [folders],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Breadcrumb Navigation ─────────────────────────────────────────── */}
      <nav
        className="flex items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-3"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          Library
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-placeholder)]" />
        <span className="text-sm font-medium text-[var(--color-text-main)]">
          {isEditing ? 'Edit Prompt' : 'New Prompt'}
        </span>
      </nav>

      {/* ── Two-Column Layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Column: Form ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <div className="space-y-5 max-w-2xl">
            {/* Title with character counter */}
            <div>
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summarize Text"
                maxLength={100}
              />
              <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">
                {countChars(title)} / 100
              </p>
            </div>

            {/* Description with character counter */}
            <div>
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
                maxLength={200}
              />
              <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">
                {countChars(description)} / 200
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-main)]">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--color-primary)]">
                {tags.map((tag) => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleAddTag}
                  placeholder={tags.length === 0 ? 'Add tags (press Enter)' : 'Add tag…'}
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
                  aria-label="Add tag"
                />
              </div>
            </div>

            {/* Folder */}
            <Select
              label="Folder"
              options={folderOptions}
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              placeholder="Select a folder"
            />

            {/* Favorite */}
            <Toggle
              checked={favorite}
              onChange={setFavorite}
              label="Favorite"
            />

            {/* Body Editor */}
            <div>
              <label
                htmlFor="prompt-body-editor"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-main)]"
              >
                Body
              </label>
              <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden focus-within:outline focus-within:outline-2 focus-within:outline-[var(--color-primary)]">
                {/* Line numbers */}
                <div className="border-r border-[var(--color-border)] bg-gray-50 py-2 pl-2">
                  <LineNumbers count={lineCount} />
                </div>
                {/* Textarea */}
                <textarea
                  id="prompt-body-editor"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your prompt template here. Use {{variable_name}} for variables."
                  rows={12}
                  className="flex-1 resize-none border-none bg-transparent px-3 py-2 font-[var(--font-mono)] text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none leading-[1.625rem]"
                  aria-describedby="body-footer"
                />
              </div>

              {/* Body Footer: formatting help, word count, char count */}
              <div
                id="body-footer"
                className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]"
              >
                <span>
                  Use <code className="rounded bg-gray-100 px-1 font-[var(--font-mono)]">{'{{variable_name}}'}</code> for template variables
                </span>
                <span>
                  {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} char{charCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Variable highlighting preview below body */}
              {body && variables.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                    Variable Highlighting
                  </p>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
                    <HighlightedBody text={body} />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" onClick={handleSave}>
                <Save className="mr-1.5 h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Create Prompt'}
              </Button>
              <Button variant="secondary" onClick={onCancel}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Preview ────────────────────────────────── */}
        <aside className="w-80 shrink-0 border-l border-[var(--color-border)] bg-gray-50 overflow-y-auto p-6 space-y-5">
          {/* Live Preview */}
          <Card padding="md">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">
              Live Preview
            </h3>
            <PreviewBody text={body} variables={variables} />
          </Card>

          {/* Detected Variables */}
          <Card padding="md">
            <VariableList variables={variables} />
            {variables.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">
                No variables detected. Use <code className="font-[var(--font-mono)]">{'{{name}}'}</code> syntax to add variables.
              </p>
            )}
          </Card>

          {/* Tips Card */}
          <Card padding="md">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-main)]">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Tips
            </h3>
            <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <li>• Be specific about the desired output format</li>
              <li>• Use variables for parts that change between uses</li>
              <li>• Include context about the audience or purpose</li>
              <li>• Break complex prompts into clear sections</li>
              <li>• Test with different variable values to ensure flexibility</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
