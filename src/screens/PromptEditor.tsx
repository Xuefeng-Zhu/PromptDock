import { useCallback, useMemo } from 'react';
import {
  PromptEditor as PromptEditorForm,
  type PromptEditorProps as PromptEditorFormProps,
} from '../components/prompt-editor';
import { usePromptStore, type CreatePromptData } from '../stores/prompt-store';
import type { Folder, PromptRecipe } from '../types/index';
import { createFolder as createStoredFolder } from '../utils/folder-storage';
import { deriveTagFilterOptions } from '../utils/library-filter-options';

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

function toCreatePromptData(data: Partial<PromptRecipe>): CreatePromptData {
  return {
    workspaceId: 'local',
    title: data.title ?? '',
    description: data.description ?? '',
    body: data.body ?? '',
    tags: data.tags ?? [],
    folderId: data.folderId ?? null,
    favorite: data.favorite ?? false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Store-backed screen adapter for the shared prompt editor form.
 *
 * The editor UI and validation live in `src/components/prompt-editor/PromptEditor.tsx`; this
 * wrapper preserves the old screen-level API for any future route-style usage.
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

  const prompt = useMemo(
    () => prompts.find((item) => item.id === promptId),
    [promptId, prompts],
  );
  const availableTags = useMemo(
    () => deriveTagFilterOptions(prompts).map((option) => option.value),
    [prompts],
  );

  const handleSave = useCallback<PromptEditorFormProps['onSave']>(
    async (data) => {
      if (promptId) {
        await updatePrompt(promptId, data);
      } else {
        await createPrompt(toCreatePromptData(data));
      }
      onSave?.();
    },
    [createPrompt, onSave, promptId, updatePrompt],
  );

  return (
    <PromptEditorForm
      promptId={promptId}
      prompt={prompt}
      availableTags={availableTags}
      folders={folders}
      onCreateFolder={createStoredFolder}
      onSave={handleSave}
      onCancel={onCancel ?? (() => undefined)}
    />
  );
}
