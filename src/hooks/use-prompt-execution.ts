import { useCallback } from 'react';
import type { PromptRecipe, UserSettings } from '../types/index';
import { copyToClipboard, pasteToActiveApp } from '../utils/clipboard';
import { trackPromptAction } from '../services/analytics-service';

export type PromptExecutionSource =
  | 'command_palette'
  | 'prompt_body'
  | 'quick_launcher'
  | 'variable_fill';

export type PromptExecutionAction = UserSettings['defaultAction'];

export interface PromptExecutionResult {
  action: 'copied' | 'pasted';
  message: string;
}

interface UsePromptExecutionOptions {
  defaultAction: PromptExecutionAction;
  markPromptUsed: (promptId: string) => Promise<unknown>;
  beforePaste?: () => Promise<void>;
}

interface ExecuteTextOptions {
  text: string;
  promptId?: string;
  source: PromptExecutionSource;
}

interface ExecutePromptOptions {
  source: PromptExecutionSource;
  action?: PromptExecutionAction;
}

function getExecutionResult(pasted: boolean): PromptExecutionResult {
  return pasted
    ? { action: 'pasted', message: 'Prompt pasted' }
    : { action: 'copied', message: 'Prompt copied to clipboard' };
}

export function usePromptExecution({
  defaultAction,
  markPromptUsed,
  beforePaste,
}: UsePromptExecutionOptions) {
  const markUsed = useCallback(
    (promptId?: string) => {
      if (!promptId) return;

      void markPromptUsed(promptId).catch((err: unknown) => {
        console.error('Failed to update last used timestamp:', err);
      });
    },
    [markPromptUsed],
  );

  const copyText = useCallback(
    async ({ text, promptId, source }: ExecuteTextOptions): Promise<PromptExecutionResult> => {
      await copyToClipboard(text);
      markUsed(promptId);
      trackPromptAction('copied', { source });
      return getExecutionResult(false);
    },
    [markUsed],
  );

  const pasteText = useCallback(
    async ({ text, promptId, source }: ExecuteTextOptions): Promise<PromptExecutionResult> => {
      const result = await pasteToActiveApp(text, beforePaste);
      markUsed(promptId);
      const executionResult = getExecutionResult(result?.pasted !== false);
      trackPromptAction(executionResult.action, { source });
      return executionResult;
    },
    [beforePaste, markUsed],
  );

  const executeText = useCallback(
    async (
      options: ExecuteTextOptions & { action?: PromptExecutionAction },
    ): Promise<PromptExecutionResult> => {
      const action = options.action ?? defaultAction;
      return action === 'paste' ? pasteText(options) : copyText(options);
    },
    [copyText, defaultAction, pasteText],
  );

  const executePrompt = useCallback(
    async (
      prompt: PromptRecipe,
      options: ExecutePromptOptions,
    ): Promise<PromptExecutionResult> =>
      executeText({
        text: prompt.body,
        promptId: prompt.id,
        source: options.source,
        action: options.action,
      }),
    [executeText],
  );

  return {
    copyText,
    pasteText,
    executeText,
    executePrompt,
  };
}
