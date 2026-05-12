import { useState, type FormEvent } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { WorkspaceInviteRole } from '../../../types/index';

interface InviteMemberDialogProps {
  onCancel: () => void;
  onInvite: (email: string, role: WorkspaceInviteRole) => Promise<void>;
}

export function InviteMemberDialog({ onCancel, onInvite }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceInviteRole>('editor');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onInvite(email, role);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form
        aria-label="Invite member"
        className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <h3 className="text-base font-semibold text-[var(--color-text-main)]">
          Invite member
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          They will see this invite after signing in with the same email.
        </p>

        <div className="mt-4 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            error={error ?? undefined}
          />

          <div>
            <span className="text-sm font-medium text-[var(--color-text-main)]">
              Role
            </span>
            <div className="mt-1.5 grid grid-cols-2 rounded-lg border border-[var(--color-border)]">
              {(['editor', 'viewer'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={[
                    'px-3 py-2 text-sm capitalize transition-colors',
                    option === 'editor' ? 'rounded-l-lg' : 'rounded-r-lg border-l border-[var(--color-border)]',
                    role === option
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:bg-gray-50',
                  ].join(' ')}
                  aria-pressed={role === option}
                  onClick={() => setRole(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send invite'}
          </Button>
        </div>
      </form>
    </div>
  );
}
