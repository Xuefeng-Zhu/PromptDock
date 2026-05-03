import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { ConflictService } from '../services/conflict-service';
import type { PromptConflict, PromptRecipe } from '../types/index';

export function useConflicts(conflictService: ConflictService) {
  const cachedConflicts = useRef<PromptConflict[]>([]);

  return useSyncExternalStore(
    useCallback((cb: () => void) => conflictService.subscribe(cb), [conflictService]),
    () => {
      const next = conflictService.getUnresolvedConflicts();
      if (
        next.length !== cachedConflicts.current.length ||
        next.some((conflict, index) =>
          conflict.id !== cachedConflicts.current[index]?.id ||
          conflict.resolvedAt !== cachedConflicts.current[index]?.resolvedAt
        )
      ) {
        cachedConflicts.current = next;
      }
      return cachedConflicts.current;
    },
  );
}

export function useConflictResolution(
  conflictService: ConflictService,
  onResolve?: (promptId: string, resolvedVersion: PromptRecipe) => void,
) {
  const handleKeepLocal = useCallback(
    (conflictId: string) => {
      const resolved = conflictService.resolveKeepLocal(conflictId);
      if (resolved) {
        onResolve?.(resolved.id, resolved);
      }
    },
    [conflictService, onResolve],
  );

  const handleKeepRemote = useCallback(
    (conflictId: string) => {
      const resolved = conflictService.resolveKeepRemote(conflictId);
      if (resolved) {
        onResolve?.(resolved.id, resolved);
      }
    },
    [conflictService, onResolve],
  );

  return {
    handleKeepLocal,
    handleKeepRemote,
  };
}
