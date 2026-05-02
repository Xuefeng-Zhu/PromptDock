import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  Copy,
  Archive,
  Files,
  ChevronDown,
  Plus,
  Star,
} from 'lucide-react';
import type { PromptRecipe, Folder } from '../types/index';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { extractVariables } from '../utils/prompt-template';
import { formatDate, formatRelativeShort } from '../utils/date-format';
import { countChars, countWords } from '../utils/text-counts';
import { BodyTemplateEditor } from './prompt-editor/BodyTemplateEditor';
import { LivePreviewPanel } from './prompt-editor/LivePreviewPanel';

// ─── Helper Functions (exported for testability) ───────────────────────────────

export { extractVariables } from '../utils/prompt-template';
export { countChars, countWords } from '../utils/text-counts';

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

        <BodyTemplateEditor
          body={body}
          charCount={charCount}
          isExpanded={isEditorExpanded}
          lineCount={lineCount}
          showFormattingHelp={showFormattingHelp}
          wordCount={wordCount}
          onBodyChange={setBody}
          onInsertVariable={handleInsertVariable}
          onToggleExpanded={() => setIsEditorExpanded((prev) => !prev)}
          onToggleFormattingHelp={() => setShowFormattingHelp((prev) => !prev)}
        />

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

      {!isEditorExpanded && (
        <LivePreviewPanel
          body={body}
          renderedPreview={renderedPreview}
          variableValues={variableValues}
          variables={variables}
          onResetPreview={handleResetPreview}
          onVariableValueChange={handleVariableValueChange}
        />
      )}
    </div>
  );
}
