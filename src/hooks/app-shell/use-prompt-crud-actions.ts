import { useCallback, useRef } from 'react';
import { trackPromptAction } from '../../services/analytics-service';
import type { PromptStore } from '../../stores/prompt-store';
import type { ToastStore } from '../../stores/toast-store';
import type { AppMode, PromptRecipe } from '../../types/index';
import type { PromptExecutionResult, PromptExecutionSource } from '../use-prompt-execution';
import type { Screen } from '../../components/app-shell/types';

type ExecuteText = (options: {
  promptId?: string;
  source: PromptExecutionSource;
  text: string;
}) => Promise<PromptExecutionResult>;

type TagUpdate = (tags: string[]) => string[];

function areTagsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}

interface UsePromptCrudActionsOptions {
  activeWorkspaceId: string;
  addToast: ToastStore['addToast'];
  archivePrompt: PromptStore['archivePrompt'];
  restorePrompt: PromptStore['restorePrompt'];
  copyText: ExecuteText;
  createPrompt: PromptStore['createPrompt'];
  deletePrompt: PromptStore['deletePrompt'];
  duplicatePrompt: PromptStore['duplicatePrompt'];
  mode: AppMode;
  prompts: PromptRecipe[];
  screen: Screen;
  selectedPromptId: string | null;
  setEditorHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  setScreen: (screen: Screen) => void;
  setSelectedPromptId: (id: string | null) => void;
  toggleFavorite: PromptStore['toggleFavorite'];
  updatePrompt: PromptStore['updatePrompt'];
  userId: string | null;
}

export function usePromptCrudActions({
  activeWorkspaceId,
  addToast,
  archivePrompt,
  restorePrompt,
  copyText,
  createPrompt,
  deletePrompt,
  duplicatePrompt,
  mode,
  prompts,
  screen,
  selectedPromptId,
  setEditorHasUnsavedChanges,
  setScreen,
  setSelectedPromptId,
  toggleFavorite,
  updatePrompt,
  userId,
}: UsePromptCrudActionsOptions) {
  const pendingTagUpdatesRef = useRef(new Map<string, Promise<void>>());
  const tagDraftsRef = useRef(new Map<string, string[]>());

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id).catch((err: unknown) => {
        addToast(`Failed to toggle favorite: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    },
    [addToast, toggleFavorite],
  );

  const handleEditorSave = useCallback(
    async (data: Partial<PromptRecipe>) => {
      try {
        if (screen.name === 'editor' && screen.promptId) {
          await updatePrompt(screen.promptId, data);
          trackPromptAction('updated');
        } else {
          const workspaceId = mode !== 'local' && userId ? activeWorkspaceId : 'local';
          const createdBy = mode !== 'local' && userId ? userId : 'local';
          await createPrompt({
            workspaceId,
            title: (data.title as string) ?? 'Untitled',
            description: (data.description as string) ?? '',
            body: (data.body as string) ?? '',
            tags: (data.tags as string[]) ?? [],
            folderId: (data.folderId as string | null) ?? null,
            favorite: (data.favorite as boolean) ?? false,
            archived: false,
            archivedAt: null,
            lastUsedAt: null,
            createdBy,
            version: 1,
          });
          trackPromptAction('created');
        }
        setEditorHasUnsavedChanges(false);
        setScreen({ name: 'library' });
      } catch (err) {
        addToast(`Failed to save prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
        throw err;
      }
    },
    [
      activeWorkspaceId,
      addToast,
      createPrompt,
      mode,
      screen,
      setEditorHasUnsavedChanges,
      setScreen,
      updatePrompt,
      userId,
    ],
  );

  const handleArchivePrompt = useCallback(
    (id: string) => {
      archivePrompt(id)
        .then(() => trackPromptAction('archived'))
        .catch((err: unknown) => {
          addToast(`Failed to archive prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
      if (selectedPromptId === id) {
        setSelectedPromptId(null);
      }
    },
    [addToast, archivePrompt, selectedPromptId, setSelectedPromptId],
  );

  const handleRestorePrompt = useCallback(
    (id: string) => {
      restorePrompt(id)
        .then(() => trackPromptAction('restored'))
        .catch((err: unknown) => {
          addToast(`Failed to restore prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
      if (selectedPromptId === id) {
        setSelectedPromptId(null);
      }
    },
    [addToast, restorePrompt, selectedPromptId, setSelectedPromptId],
  );

  const handleDuplicatePrompt = useCallback(
    (id: string) => {
      duplicatePrompt(id)
        .then(() => trackPromptAction('duplicated'))
        .catch((err: unknown) => {
          addToast(`Failed to duplicate prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    },
    [addToast, duplicatePrompt],
  );

  const handleDeletePrompt = useCallback(
    (id: string) => {
      deletePrompt(id)
        .then(() => trackPromptAction('deleted'))
        .catch((err: unknown) => {
          addToast(`Failed to delete prompt: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
      if (selectedPromptId === id) {
        setSelectedPromptId(null);
      }
    },
    [addToast, deletePrompt, selectedPromptId, setSelectedPromptId],
  );

  const handleEditPrompt = useCallback(
    (id: string) => {
      setScreen({ name: 'editor', promptId: id });
    },
    [setScreen],
  );

  const handleUpdatePromptTags = useCallback(
    (id: string, updateTags: TagUpdate) => {
      const baseTags =
        tagDraftsRef.current.get(id)
        ?? prompts.find((prompt) => prompt.id === id)?.tags
        ?? [];
      const nextTags = updateTags(baseTags);

      if (areTagsEqual(baseTags, nextTags)) return;

      tagDraftsRef.current.set(id, nextTags);

      const previousUpdate = pendingTagUpdatesRef.current.get(id) ?? Promise.resolve();
      const queuedUpdate = previousUpdate
        .catch(() => undefined)
        .then(async () => {
          await updatePrompt(id, { tags: nextTags });
          trackPromptAction('updated');
        })
        .catch((err: unknown) => {
          addToast(`Failed to update tags: ${err instanceof Error ? err.message : String(err)}`, 'error');
        })
        .finally(() => {
          if (pendingTagUpdatesRef.current.get(id) === queuedUpdate) {
            pendingTagUpdatesRef.current.delete(id);
          }
          if (tagDraftsRef.current.get(id) === nextTags) {
            tagDraftsRef.current.delete(id);
          }
        });

      pendingTagUpdatesRef.current.set(id, queuedUpdate);
    },
    [addToast, prompts, updatePrompt],
  );

  const handleUpdatePromptFolder = useCallback(
    (id: string, folderId: string | null) => {
      updatePrompt(id, { folderId })
        .then(() => trackPromptAction('updated'))
        .catch((err: unknown) => {
          addToast(`Failed to update folder: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    },
    [addToast, updatePrompt],
  );

  const handleCopyPromptBody = useCallback(
    (body: string, promptId?: string) => {
      copyText({ text: body, promptId, source: 'prompt_body' })
        .then(() => {
          addToast('Prompt body copied to clipboard', 'success');
        })
        .catch((err: unknown) => {
          addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    },
    [addToast, copyText],
  );

  const editorPromptId = screen.name === 'editor' ? screen.promptId : undefined;

  const handleEditorDuplicate = useCallback(() => {
    if (!editorPromptId) return;
    handleDuplicatePrompt(editorPromptId);
    setScreen({ name: 'library' });
  }, [editorPromptId, handleDuplicatePrompt, setScreen]);

  const handleEditorArchive = useCallback(() => {
    if (!editorPromptId) return;
    handleArchivePrompt(editorPromptId);
    setScreen({ name: 'library' });
  }, [editorPromptId, handleArchivePrompt, setScreen]);

  const handleEditorCopy = useCallback((body: string) => {
    handleCopyPromptBody(body, editorPromptId);
  }, [editorPromptId, handleCopyPromptBody]);

  return {
    editorPromptId,
    handleArchivePrompt,
    handleCopyPromptBody,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleRestorePrompt,
    handleEditPrompt,
    handleEditorArchive,
    handleEditorCopy,
    handleEditorDuplicate,
    handleEditorSave,
    handleToggleFavorite,
    handleUpdatePromptFolder,
    handleUpdatePromptTags,
  };
}
