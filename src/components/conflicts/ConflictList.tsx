import type { PromptConflict } from '../../types/index';
import { ConflictItem } from './ConflictItem';

interface ConflictListProps {
  conflicts: PromptConflict[];
  onKeepLocal: (conflictId: string) => void;
  onKeepRemote: (conflictId: string) => void;
}

export function ConflictList({
  conflicts,
  onKeepLocal,
  onKeepRemote,
}: ConflictListProps) {
  return (
    <div className="space-y-4">
      {conflicts.map((conflict) => (
        <ConflictItem
          key={conflict.id}
          conflict={conflict}
          onKeepLocal={onKeepLocal}
          onKeepRemote={onKeepRemote}
        />
      ))}
    </div>
  );
}
