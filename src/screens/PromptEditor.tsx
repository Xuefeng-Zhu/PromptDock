import { useState, useEffect, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { usePromptStore, type CreatePromptData } from '../stores/prompt-store';
import type { Folder } from '../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptEditorProps {
  /** If provided, load the existing prompt for editing. Otherwise create a new one. */
  promptId?: string;
  /** Available folders for the folder select dropdown. */
  folders?: Folder[];
  /** Called after a successful save (create or update). */
  onSave?: () => void;
  /** Called when the user cancels editing. */
  onCancel?: () => void;
}

// ─── Variable highlighting helper ──────────────────────────────────────────────

const VARIABLE_REGEX = /(\{\{\w+\}\})/g;

/**
 * Splits a template string into segments of plain text and variable placeholders.
 * Used to render highlighted variables in the body editor preview.
 */
function splitByVariables(text: string): { text: string; isVariable: boolean }[] {
  const parts = text.split(VARIABLE_REGEX);
  return parts
    .filter((p) => p.length > 0)
    .map((p) => ({
      text: p,
      isVariable: VARIABLE_REGEX.test(p),
    }));
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Prompt Editor screen for creating or editing a PromptRecipe.
 *
 * Includes: TitleInput, DescriptionInput, BodyEditor (with variable highlighting),
 * TagInput, and FolderSelect.
 */
export function PromptEditor({
  promptId,
  folders = [],
  onSave,
  onCancel,
}: PromptEditorProps) {
  const prompts = usePromptStore((s) => s.prompts);
  const createPrompt = usePromptStore((s) => s.createPrompt);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(promptId);

  // ── Populate fields when editing ───────────────────────────────────────────
  useEffect(() => {
    if (!promptId) return;
    const existing = prompts.find((p) => p.id === promptId);
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setBody(existing.body);
      setTags([...existing.tags]);
      setFolderId(existing.folderId);
    }
  }, [promptId, prompts]);

  // ── Variable highlighting segments ─────────────────────────────────────────
  const bodySegments = useMemo(() => splitByVariables(body), [body]);

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
      if (e.key === 'Enter' || e.key === ',') {
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
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!body.trim()) {
      setError('Body is required.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && promptId) {
        await updatePrompt(promptId, {
          title: title.trim(),
          description: description.trim(),
          body,
          tags,
          folderId,
        });
      } else {
        const data: CreatePromptData = {
          workspaceId: 'local',
          title: title.trim(),
          description: description.trim(),
          body,
          tags,
          folderId,
          favorite: false,
          archived: false,
          archivedAt: null,
          lastUsedAt: null,
          createdBy: 'local',
          version: 1,
        };
        await createPrompt(data);
      }
      onSave?.();
    } catch {
      setError('Failed to save prompt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Prompt' : 'New Prompt'}
        </h1>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            form="prompt-editor-form"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </header>

      {/* Form */}
      <form
        id="prompt-editor-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="prompt-title"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="prompt-title"
              type="text"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="e.g. Summarize Text"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              required
              aria-required="true"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="prompt-description"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <input
              id="prompt-description"
              type="text"
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="Brief description of what this prompt does"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Body Editor with variable highlighting */}
          <div>
            <label
              htmlFor="prompt-body"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Body <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="prompt-body"
                value={body}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                placeholder="Write your prompt template here. Use {{variable_name}} for variables."
                rows={10}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                required
                aria-required="true"
                aria-describedby="body-hint"
              />
            </div>
            <p id="body-hint" className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{'{{variable_name}}'}</code> syntax for template variables.
            </p>

            {/* Variable highlight preview */}
            {body && bodySegments.some((s) => s.isVariable) && (
              <div
                className="mt-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                aria-label="Body preview with highlighted variables"
              >
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Preview
                </p>
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                  {bodySegments.map((segment, i) =>
                    segment.isVariable ? (
                      <span
                        key={i}
                        className="rounded bg-purple-100 px-0.5 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      >
                        {segment.text}
                      </span>
                    ) : (
                      <span key={i}>{segment.text}</span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="prompt-tags"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="prompt-tags"
                type="text"
                value={tagInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)' : 'Add tag…'}
                className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Folder Select */}
          <div>
            <label
              htmlFor="prompt-folder"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Folder
            </label>
            <select
              id="prompt-folder"
              value={folderId ?? ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFolderId(e.target.value || null)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
