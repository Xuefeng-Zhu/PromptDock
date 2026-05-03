import {
  ConflictCenterHeader,
  ConflictEmptyState,
  ConflictList,
} from '../components/conflicts';
import { useConflictResolution, useConflicts } from '../hooks/use-conflicts';
import type { ConflictService } from '../services/conflict-service';
import type { PromptRecipe } from '../types/index';

export interface ConflictCenterProps {
  conflictService: ConflictService;
  onResolve?: (promptId: string, resolvedVersion: PromptRecipe) => void;
  onBack?: () => void;
}

export function ConflictCenter({
  conflictService,
  onResolve,
  onBack,
}: ConflictCenterProps) {
  const conflicts = useConflicts(conflictService);
  const { handleKeepLocal, handleKeepRemote } = useConflictResolution(
    conflictService,
    onResolve,
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <ConflictCenterHeader conflictCount={conflicts.length} onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4">
        {conflicts.length === 0 ? (
          <ConflictEmptyState />
        ) : (
          <ConflictList
            conflicts={conflicts}
            onKeepLocal={handleKeepLocal}
            onKeepRemote={handleKeepRemote}
          />
        )}
      </div>
    </div>
  );
}
