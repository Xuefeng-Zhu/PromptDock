import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  Copy,
  Archive,
  Files,
  ChevronDown,
  Code,
  Info,
  Maximize2,
  Minimize2,
  Plus,
  Star,
  X,
  Lightbulb,
} from 'lucide-react';
import type { PromptRecipe, Folder } from '../types/index';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { VariableParser } from '../services/variable-parser';

// ─── Helper Functions (exported for testability) ───────────────────────────────

/**
 * Extract unique variable names from `{{variable_name}}` placeholders
 * in first-appearance order.
 */
export function extractVariables(body: string): string[] {
  return variableParser.parse(body);
}

const variableParser = new VariableParser();

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
  onSave: (data: Partial<PromptRecipe>) => void | Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onCopy?: () => void;
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

// ─── Highlighted Body Overlay ──────────────────────────────────────────────────

/**
 * Renders body text with `{{variable_name}}` highlighted in blue.
 * Used as a visual overlay behind the textarea.
 */
function HighlightedBody({ text }: { text: string }) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return (
    <div className="whitespace-pre-wrap font-[var(--font-mono)] text-sm leading-[1.625rem] text-[var(--color-text-main)]">
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span
            key={i}
            className="rounded px-0.5 text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium"
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

// ─── Format Date Helper ────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeShort(date: Date | null): string {
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

function areTagsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((tag, index) => tag === right[index]);
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Prompt Editor matching the high-fidelity mockup.
 * Single-column layout with breadcrumb, header actions, form fields,
 * body editor with line numbers and variable highlighting, and metadata footer.
 */
export function PromptEditor({
  promptId,
  prompt,
  folders,
  onSave,
  onCancel,
  onDirtyChange,
  onDuplicate,
  onArchive,
  onCopy,
}: PromptEditorProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [body, setBody] = useState(prompt?.body ?? '');
  const [tags, setTags] = useState<string[]>(prompt?.tags ? [...prompt.tags] : []);
  const [folderId, setFolderId] = useState<string | null>(prompt?.folderId ?? null);
  const [favorite, setFavorite] = useState(prompt?.favorite ?? false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === folderId),
    [folders, folderId],
  );

  const hasUnsavedChanges = useMemo(() => {
    const initialTags = prompt?.tags ?? [];
    return (
      title !== (prompt?.title ?? '') ||
      description !== (prompt?.description ?? '') ||
      body !== (prompt?.body ?? '') ||
      folderId !== (prompt?.folderId ?? null) ||
      favorite !== (prompt?.favorite ?? false) ||
      !areTagsEqual(tags, initialTags) ||
      tagInput.trim().length > 0
    );
  }, [body, description, favorite, folderId, prompt, tagInput, tags, title]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  // ── Tag management ─────────────────────────────────────────────────────────
  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
    setShowTagInput(false);
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
      if (e.key === 'Escape') {
        setTagInput('');
        setShowTagInput(false);
      }
    },
    [handleAddTag],
  );

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // ── Insert variable helper ─────────────────────────────────────────────────
  const handleInsertVariable = useCallback(() => {
    setBody((prev) => prev + '{{variable_name}}');
  }, []);

  // ── Save handler ───────────────────────────────────────────────────────────
  const savePrompt = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setValidationError('Title is required.');
      return;
    }
    if (!trimmedBody) {
      setValidationError('Body is required.');
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        body,
        tags,
        folderId,
        favorite,
      });
    } catch (err) {
      setValidationError(
        `Failed to save prompt: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [onSave, title, description, body, tags, folderId, favorite]);

  // ── Save options dropdown state ────────────────────────────────────────────
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const handleSaveAndClose = useCallback(() => {
    void savePrompt();
    setShowSaveOptions(false);
  }, [savePrompt]);

  // ── Folder options for Select ──────────────────────────────────────────────
  const folderOptions = useMemo(
    () => [
      { value: '', label: 'No folder' },
      ...folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [folders],
  );

  // ── Variable preview values ─────────────────────────────────────────────────
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const handleVariableValueChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleResetPreview = useCallback(() => {
    setVariableValues({});
  }, []);

  const renderedPreview = useMemo(() => {
    if (!body) return '';
    let result = body;
    for (const v of variables) {
      const val = variableValues[v];
      if (val) {
        result = result.replaceAll(`{{${v}}}`, val);
      }
    }
    return result;
  }, [body, variables, variableValues]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-background)]">
      {/* ── Left Column: Editor Form ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className={isEditorExpanded ? 'mx-auto w-full px-8 py-6' : 'mx-auto w-full max-w-4xl px-8 py-6'}>
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav className="mb-2 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={onCancel}
            className="text-[var(--color-primary)] hover:underline"
          >
            {currentFolder?.name ?? 'Library'}
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-placeholder)]" />
          <span className="text-[var(--color-text-muted)]">
            {isEditing ? (prompt?.title ?? 'Edit Prompt') : 'New Prompt'}
          </span>
        </nav>

        {/* ── Header: Title + Action Buttons ──────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-text-main)]">
            {isEditing ? 'Edit Prompt' : 'New Prompt'}
          </h1>
          <div className="flex items-center gap-2">
            {isEditing && (onDuplicate || onArchive || onCopy) && (
              <>
                {onDuplicate && (
                  <Button variant="secondary" size="sm" onClick={onDuplicate}>
                    <Files className="mr-1.5 h-4 w-4" />
                    Duplicate
                  </Button>
                )}
                {onArchive && (
                  <Button variant="secondary" size="sm" onClick={onArchive}>
                    <Archive className="mr-1.5 h-4 w-4" />
                    Archive
                  </Button>
                )}
                {onCopy && (
                  <Button variant="secondary" size="sm" onClick={onCopy}>
                    <Copy className="mr-1.5 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </>
            )}
            <div className="relative flex">
              <Button
                variant="primary"
                size="sm"
                className="rounded-r-none"
                onClick={() => void savePrompt()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="rounded-l-none border-l border-white/20 px-2"
                aria-label="Save options"
                disabled={isSaving}
                onClick={() => setShowSaveOptions((prev) => !prev)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showSaveOptions && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleSaveAndClose}
                    className="flex w-full items-center px-3 py-2 text-sm text-[var(--color-text-main)] hover:bg-gray-100 transition-colors"
                  >
                    Save and Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {validationError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {validationError}
          </div>
        )}

        {/* ── Title Field ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <label
            htmlFor="editor-title"
            className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
          >
            Title
          </label>
          <div className="relative">
            <input
              id="editor-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summarize Text"
              maxLength={100}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
              {countChars(title)}/100
            </span>
          </div>
        </div>

        {/* ── Description Field ───────────────────────────────────────────── */}
        <div className="mb-6">
          <label
            htmlFor="editor-description"
            className="mb-2 block text-sm font-medium text-[var(--color-text-main)]"
          >
            Description
          </label>
          <div className="relative">
            <textarea
              id="editor-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this prompt does"
              maxLength={300}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none transition-colors resize-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            <span className="absolute right-4 bottom-3 text-xs text-[var(--color-text-muted)]">
              {countChars(description)}/300
            </span>
          </div>
        </div>

        {/* ── Tags / Folder / Favorite Row ────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-3 gap-6">
          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  #{tag}
                </button>
              ))}
              {showTagInput ? (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleAddTag}
                  autoFocus
                  placeholder="tag name"
                  className="w-24 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs outline-none focus:border-[var(--color-primary)]"
                  aria-label="Add tag"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Add tag"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
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
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
              Favorite
            </label>
            <div className="flex items-center gap-2">
              <Toggle
                checked={favorite}
                onChange={setFavorite}
                label=""
              />
              <Star
                className={[
                  'h-5 w-5 transition-colors',
                  favorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-[var(--color-text-placeholder)]',
                ].join(' ')}
              />
            </div>
          </div>
        </div>

        {/* ── Body Section ────────────────────────────────────────────────── */}
        <div className="mb-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor="prompt-body-editor"
                className="text-sm font-medium text-[var(--color-text-main)]"
              >
                Body
              </label>
              <span className="text-xs text-[var(--color-text-muted)]">
                Use {'{{variable}}'} to insert variables
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleInsertVariable}>
              <Code className="mr-1.5 h-3.5 w-3.5" />
              Insert variable
            </Button>
          </div>

          {/* Body Editor with line numbers */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20">
            <div className="flex">
              {/* Line numbers */}
              <div className="border-r border-[var(--color-border)] bg-gray-50 py-3 pl-3">
                <LineNumbers count={lineCount} />
              </div>
              {/* Editor area with highlighting overlay */}
              <div className="relative flex-1">
                {/* Highlighted overlay (behind textarea) */}
                <div className="pointer-events-none absolute inset-0 px-4 py-3 overflow-hidden">
                  <HighlightedBody text={body} />
                </div>
                {/* Actual textarea (transparent text, visible caret) */}
                <textarea
                  id="prompt-body-editor"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your prompt template here. Use {{variable_name}} for variables."
                  rows={Math.max(lineCount + 2, 12)}
                  className="relative w-full resize-none border-none bg-transparent px-4 py-3 font-[var(--font-mono)] text-sm text-transparent caret-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none leading-[1.625rem]"
                  style={{ caretColor: 'var(--color-text-main)' }}
                  aria-label="Body"
                  aria-describedby="body-footer"
                />
              </div>
            </div>

            {/* Body Footer */}
            <div
              id="body-footer"
              className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]"
            >
              <button
                type="button"
                onClick={() => setShowFormattingHelp((prev) => !prev)}
                className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                aria-expanded={showFormattingHelp}
                aria-controls="formatting-help"
              >
                <Info className="h-3.5 w-3.5" />
                Formatting help
              </button>
              <div className="flex items-center gap-3">
                <span>{wordCount} words · {charCount} characters</span>
                <button
                  type="button"
                  onClick={() => setIsEditorExpanded((prev) => !prev)}
                  className="hover:text-[var(--color-primary)] transition-colors"
                  aria-label={isEditorExpanded ? 'Restore preview' : 'Expand editor'}
                  aria-pressed={isEditorExpanded}
                >
                  {isEditorExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          {showFormattingHelp && (
            <div
              id="formatting-help"
              className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-xs text-[var(--color-text-muted)]"
            >
              <p className="font-medium text-[var(--color-text-main)]">Template formatting</p>
              <p className="mt-1">Use double braces for variables, such as {'{{topic}}'} or {'{{audience}}'}.</p>
              <p className="mt-1">Line breaks and spacing are preserved in the final prompt.</p>
            </div>
          )}
        </div>

        {/* ── Metadata Footer ─────────────────────────────────────────────── */}
        {isEditing && prompt && (
          <div className="mt-6 flex items-center gap-8 text-xs text-[var(--color-text-muted)]">
            <span>Created {formatDate(prompt.createdAt)}</span>
            <span>Updated {formatDate(prompt.updatedAt)}</span>
            <span className="ml-auto">Last used {formatRelativeShort(prompt.lastUsedAt)}</span>
          </div>
        )}
        </div>
      </div>

      {/* ── Right Column: Live Preview ──────────────────────────────────────── */}
      {!isEditorExpanded && (
      <aside className="w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto">
        {/* Live Preview Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Live Preview</h2>
          <button
            type="button"
            onClick={handleResetPreview}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Preview variable inputs */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">Preview with example values</p>
          {variables.map((v) => (
            <div
              key={v}
              className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <label className="block text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5">
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </label>
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={variableValues[v] ?? ''}
                  onChange={(e) => handleVariableValueChange(v, e.target.value)}
                  placeholder={`Enter ${v}…`}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-placeholder)] outline-none"
                  aria-label={`Preview value for ${v}`}
                />
                {variableValues[v] && (
                  <button
                    type="button"
                    onClick={() => handleVariableValueChange(v, '')}
                    className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                    aria-label={`Clear ${v}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {variables.length === 0 && (
            <p className="text-xs text-[var(--color-text-placeholder)] italic">
              No variables detected yet
            </p>
          )}
        </div>

        {/* Preview Result */}
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">Preview Result</h3>
          {body ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-[var(--font-mono)] text-xs leading-relaxed text-[var(--color-text-main)]">
                {renderedPreview}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-placeholder)] italic">
              Start typing in the body editor to see a preview…
            </p>
          )}
        </div>

        {/* Tips */}
        <div className="border-t border-[var(--color-border)] px-5 py-4 bg-amber-50">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-main)]">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Tips
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Variables make your prompt reusable. Use clear names like{' '}
            <span className="text-[var(--color-primary)]">audience</span>,{' '}
            <span className="text-[var(--color-primary)]">format</span>, or{' '}
            <span className="text-[var(--color-primary)]">text</span>{' '}
            for best results.
          </p>
        </div>
      </aside>
      )}
    </div>
  );
}
