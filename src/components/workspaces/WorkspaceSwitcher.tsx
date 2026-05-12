import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspace-store';
import type { WorkspaceRole } from '../../types/index';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useDismissablePopover } from '../ui/listbox/use-dismissable-popover';
import { WorkspaceColorMark } from './WorkspaceColorMark';

interface WorkspaceSwitcherProps {
  onManageSharing?: () => void;
}

function roleLabel(role: WorkspaceRole | null): string {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function RoleBadge({ role }: { role: WorkspaceRole | null }) {
  return (
    <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
      {roleLabel(role)}
    </span>
  );
}

export function WorkspaceSwitcher({ onManageSharing }: WorkspaceSwitcherProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const currentRole = useWorkspaceStore((s) => s.currentRole);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  useDismissablePopover({
    containerRef,
    onDismiss: () => setOpen(false),
    open,
  });

  const close = useCallback(() => {
    setOpen(false);
    setCreateOpen(false);
    setError(null);
  }, []);

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Switch workspace"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="hidden min-w-0 max-w-52 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-2.5 py-1.5 text-sm text-[var(--color-text-main)] transition-colors hover:bg-gray-50 sm:flex"
      >
        <WorkspaceColorMark size="sm" workspace={activeWorkspace} />
        <span className="truncate">{activeWorkspace?.name ?? 'Workspace'}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Workspaces"
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-lg"
        >
          <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Workspaces
          </div>

          <div className="max-h-64 overflow-y-auto">
            {workspaces.map((workspace) => {
              const selected = workspace.id === activeWorkspaceId;
              const role = memberships.find((item) => item.workspaceId === workspace.id)?.role ?? null;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    selected
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-main)] hover:bg-gray-50',
                  ].join(' ')}
                  onClick={() => {
                    void switchWorkspace(workspace.id).then(close).catch((err) => {
                      setError(err instanceof Error ? err.message : String(err));
                    });
                  }}
                >
                  <WorkspaceColorMark size="sm" workspace={workspace} />
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  <RoleBadge role={role} />
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          {createOpen ? (
            <form className="mt-2 space-y-2 border-t border-[var(--color-border)] pt-2" onSubmit={handleCreateWorkspace}>
              <Input
                aria-label="New workspace name"
                placeholder="New workspace"
                value={newWorkspaceName}
                onChange={(event) => setNewWorkspaceName(event.target.value)}
                error={error ?? undefined}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              {error && <p className="mb-2 px-2 text-xs text-red-600">{error}</p>}
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[var(--color-text-main)] hover:bg-gray-50"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 text-[var(--color-text-muted)]" />
                New workspace
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[var(--color-text-main)] hover:bg-gray-50"
                onClick={() => {
                  close();
                  onManageSharing?.();
                }}
              >
                <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />
                Manage sharing
                <RoleBadge role={currentRole} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
