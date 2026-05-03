import { useCallback, useSyncExternalStore } from 'react';
import type { ConflictService } from '../../services/conflict-service';
import type { PromptStore } from '../../stores/prompt-store';
import type { ToastStore } from '../../stores/toast-store';
import type { PromptRecipe } from '../../types/index';

interface UseConflictControllerOptions {
  addToast: ToastStore['addToast'];
  conflictService: ConflictService | null;
  updatePrompt: PromptStore['updatePrompt'];
}

export function useConflictController({
  addToast,
  conflictService,
  updatePrompt,
}: UseConflictControllerOptions) {
  const unresolvedConflictCount = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        if (!conflictService) return () => {};
        return conflictService.subscribe(cb);
      },
      [conflictService],
    ),
    () => conflictService?.getUnresolvedCount() ?? 0,
  );

  const handleConflictResolve = useCallback(
    (promptId: string, resolvedVersion: PromptRecipe) => {
      updatePrompt(promptId, resolvedVersion).catch((err: unknown) => {
        addToast(`Failed to resolve conflict: ${err instanceof Error ? err.message : String(err)}`, 'error');
      });
    },
    [addToast, updatePrompt],
  );

  return {
    handleConflictResolve,
    unresolvedConflictCount,
  };
}
