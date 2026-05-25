import type { FormEvent } from 'react';
import { Check, LogOut, Plus, Trash2 } from 'lucide-react';
import type {
  Workspace,
  WorkspaceMembership,
  WorkspaceRemovalIntent,
} from '../../../types/index';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { WorkspaceColorMark } from '../../workspaces';
import { roleForWorkspace, WorkspaceRoleBadge } from './WorkspaceSharingRole';

export function WorkspaceListSection({
  activeWorkspaceId,
  createOpen,
  isCreatingWorkspace,
  isRemovingWorkspace,
  isSwitchingWorkspace,
  memberships,
  newWorkspaceName,
  onCancelCreate,
  onCreateWorkspace,
  onNewWorkspaceNameChange,
  onOpenCreate,
  onRemoveWorkspace,
  onSwitchWorkspace,
  userId,
  workspaces,
}: {
  activeWorkspaceId: string;
  createOpen: boolean;
  isCreatingWorkspace: boolean;
  isRemovingWorkspace: (workspaceId: string) => boolean;
  isSwitchingWorkspace: (workspaceId: string) => boolean;
  memberships: WorkspaceMembership[];
  newWorkspaceName: string;
  onCancelCreate: () => void;
  onCreateWorkspace: (event: FormEvent<HTMLFormElement>) => void;
  onNewWorkspaceNameChange: (name: string) => void;
  onOpenCreate: () => void;
  onRemoveWorkspace: (intent: WorkspaceRemovalIntent) => void;
  onSwitchWorkspace: (workspaceId: Workspace['id']) => void;
  userId: string | null;
  workspaces: Workspace[];
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Workspaces</h4>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]">
        {workspaces.map((workspace) => {
          const selected = workspace.id === activeWorkspaceId;
          const role = roleForWorkspace(memberships, workspace.id);
          const isPersonalWorkspace = workspace.id === userId;
          const canDeleteWorkspace = role === 'owner' && workspace.ownerId === userId && !isPersonalWorkspace;
          const canLeaveWorkspace = role !== null && role !== 'owner';
          const removingWorkspace = isRemovingWorkspace(workspace.id);
          return (
            <div
              key={workspace.id}
              className={[
                'flex w-full items-center gap-2 border-b border-[var(--color-border)] text-sm transition-colors last:border-b-0',
                selected
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-main)] hover:bg-gray-50',
              ].join(' ')}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
                disabled={selected || isSwitchingWorkspace(workspace.id)}
                onClick={() => onSwitchWorkspace(workspace.id)}
              >
                <WorkspaceColorMark size="sm" workspace={workspace} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {workspace.name}
                </span>
                <WorkspaceRoleBadge role={role} />
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
              {canDeleteWorkspace && (
                <button
                  type="button"
                  className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  disabled={removingWorkspace}
                  onClick={() => onRemoveWorkspace({ action: 'delete', workspace })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
              {canLeaveWorkspace && (
                <button
                  type="button"
                  className="mr-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)]"
                  disabled={removingWorkspace}
                  onClick={() => onRemoveWorkspace({ action: 'leave', workspace })}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Leave
                </button>
              )}
            </div>
          );
        })}

        {createOpen ? (
          <form className="space-y-2 border-t border-[var(--color-border)] p-3" onSubmit={onCreateWorkspace}>
            <Input
              aria-label="New workspace name"
              placeholder="New workspace"
              value={newWorkspaceName}
              onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancelCreate}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newWorkspaceName.trim() || isCreatingWorkspace}>
                Create
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2.5 text-left text-sm text-[var(--color-text-main)] transition-colors hover:bg-gray-50"
            onClick={onOpenCreate}
          >
            <Plus className="h-4 w-4 text-[var(--color-text-muted)]" />
            New workspace
          </button>
        )}
      </div>
    </div>
  );
}
