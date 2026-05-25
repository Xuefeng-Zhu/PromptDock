import type { Workspace } from '../../../types/index';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export function WorkspaceRenameSection({
  activeWorkspace,
  isRenamingWorkspace,
  onRenameWorkspace,
  onWorkspaceNameChange,
  workspaceName,
}: {
  activeWorkspace: Workspace | undefined;
  isRenamingWorkspace: boolean;
  onRenameWorkspace: () => void;
  onWorkspaceNameChange: (name: string) => void;
  workspaceName: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          label="Workspace name"
          value={workspaceName}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
        />
        <div className="flex items-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRenameWorkspace}
            disabled={!workspaceName.trim() || workspaceName === activeWorkspace?.name || isRenamingWorkspace}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
