import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ToastStore } from '../../stores/toast-store';
import type { PromptRecipe, UserSettings } from '../../types/index';
import { extractVariables } from '../../utils/prompt-template';
import type {
  PromptExecutionResult,
  PromptExecutionSource,
} from '../use-prompt-execution';

type ExecuteText = (options: {
  promptId?: string;
  source: PromptExecutionSource;
  text: string;
}) => Promise<PromptExecutionResult>;

type ExecutePrompt = (
  prompt: PromptRecipe,
  options: { source: PromptExecutionSource },
) => Promise<PromptExecutionResult>;

interface UsePromptLaunchFlowOptions {
  addToast: ToastStore['addToast'];
  copyText: ExecuteText;
  defaultAction: UserSettings['defaultAction'];
  executePrompt: ExecutePrompt;
  pasteText: ExecuteText;
  setCommandPaletteOpen: (open: boolean) => void;
  setVariableFillPromptId: Dispatch<SetStateAction<string | null>>;
  variableFillPromptId: string | null;
}

/**
 * Coordinates prompt execution from the command palette and variable modal.
 * Prompts with placeholders are routed through the fill flow; prompts without
 * placeholders execute immediately using the user's default copy/paste action.
 */
export function usePromptLaunchFlow({
  addToast,
  copyText,
  defaultAction,
  executePrompt,
  pasteText,
  setCommandPaletteOpen,
  setVariableFillPromptId,
  variableFillPromptId,
}: UsePromptLaunchFlowOptions) {
  const handleCommandPaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  const handleCommandPaletteSelect = useCallback(
    (prompt: PromptRecipe) => {
      const variables = extractVariables(prompt.body);
      setCommandPaletteOpen(false);

      if (variables.length > 0) {
        setVariableFillPromptId(prompt.id);
        return;
      }

      executePrompt(prompt, { source: 'command_palette' })
        .then((result) => {
          addToast(result.message, 'success');
        })
        .catch((err: unknown) => {
          const action = defaultAction === 'paste' ? 'paste' : 'copy';
          addToast(`Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`, 'error');
        });
    },
    [addToast, defaultAction, executePrompt, setCommandPaletteOpen, setVariableFillPromptId],
  );

  const handleVariableFillCancel = useCallback(() => {
    setVariableFillPromptId(null);
  }, [setVariableFillPromptId]);

  const handleVariableFillCopy = useCallback(
    async (renderedText: string) => {
      const promptId = variableFillPromptId;
      try {
        const result = await copyText({
          text: renderedText,
          promptId: promptId ?? undefined,
          source: 'variable_fill',
        });
        addToast(result.message, 'success');
        // Close only the modal that initiated this async copy; if the user has
        // opened another prompt meanwhile, leave the newer modal in place.
        setVariableFillPromptId((currentId) => (currentId === promptId ? null : currentId));
      } catch (err) {
        addToast(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`, 'error');
        throw err;
      }
    },
    [addToast, copyText, setVariableFillPromptId, variableFillPromptId],
  );

  const handleVariableFillPaste = useCallback(
    async (renderedText: string) => {
      const promptId = variableFillPromptId;
      try {
        const result = await pasteText({
          text: renderedText,
          promptId: promptId ?? undefined,
          source: 'variable_fill',
        });
        addToast(result.message, 'success');
        // Close only the modal that initiated this async paste; if the user has
        // opened another prompt meanwhile, leave the newer modal in place.
        setVariableFillPromptId((currentId) => (currentId === promptId ? null : currentId));
      } catch (err) {
        addToast(`Failed to paste: ${err instanceof Error ? err.message : String(err)}`, 'error');
        throw err;
      }
    },
    [addToast, pasteText, setVariableFillPromptId, variableFillPromptId],
  );

  return {
    handleCommandPaletteClose,
    handleCommandPaletteSelect,
    handleVariableFillCancel,
    handleVariableFillCopy,
    handleVariableFillPaste,
  };
}
