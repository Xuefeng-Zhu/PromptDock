import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Files } from 'lucide-react';
import type { DuplicateWorkspaceTarget } from '../app-shell/types';
import type { PromptRecipe, WorkspaceRole } from '../../types/index';
import { WorkspaceColorMark } from '../workspaces/WorkspaceColorMark';
import { Button } from '../ui/Button';

interface DuplicatePromptDialogProps {
  activeWorkspaceId: string;
  onCancel: () => void;
  onConfirm: (workspaceId: string) => Promise<void>;
  prompt: PromptRecipe;
  targets: DuplicateWorkspaceTarget[];
}

function roleLabel(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function DuplicatePromptDialog({
  activeWorkspaceId,
  onCancel,
  onConfirm,
  prompt,
  targets,
}: DuplicatePromptDialogProps) {
  const defaultWorkspaceId = useMemo(() => (
    targets.some((target) => target.workspace.id === activeWorkspaceId)
      ? activeWorkspaceId
      : targets[0]?.workspace.id ?? ''
  ), [activeWorkspaceId, targets]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(defaultWorkspaceId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedWorkspaceId(defaultWorkspaceId);
  }, [defaultWorkspaceId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId) return;

    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(selectedWorkspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
      <form
        aria-describedby="duplicate-prompt-description"
        aria-label="Duplicate prompt"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <Files className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--color-text-main)]">
              Duplicate prompt
            </h3>
            <p
              className="mt-1 truncate text-sm text-[var(--color-text-muted)]"
              id="duplicate-prompt-description"
            >
              {prompt.title}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-[var(--color-text-main)]">
            Workspace
          </span>
          <div className="mt-2 space-y-2" role="radiogroup" aria-label="Target workspace">
            {targets.map(({ role, workspace }) => {
              const selected = selectedWorkspaceId === workspace.id;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={[
                    'flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : 'border-[var(--color-border)] hover:bg-gray-50',
                  ].join(' ')}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <WorkspaceColorMark size="sm" workspace={workspace} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--color-text-main)]">
                      {workspace.name}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {workspace.id === activeWorkspaceId ? 'Current workspace' : roleLabel(role)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !selectedWorkspaceId}>
            {submitting ? 'Duplicating...' : 'Duplicate'}
          </Button>
        </div>
      </form>
    </div>
  );
}
