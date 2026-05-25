import type { FormEvent } from 'react';
import { Globe2 } from 'lucide-react';
import type { WorkspaceDomainInvite } from '../../../types/index';
import { formatWorkspaceRole, workspaceRoleBadgeClass } from '../../../utils/workspace-role';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export function DomainAccessSection({
  domainInvites,
  isRevokingDomainInvite,
  newDomain,
  onCreateDomainInvite,
  onNewDomainChange,
  onRevokeDomainInvite,
  submittingDomain,
}: {
  domainInvites: WorkspaceDomainInvite[];
  isRevokingDomainInvite: (inviteId: string) => boolean;
  newDomain: string;
  onCreateDomainInvite: (event: FormEvent<HTMLFormElement>) => void;
  onNewDomainChange: (domain: string) => void;
  onRevokeDomainInvite: (inviteId: string) => void;
  submittingDomain: boolean;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-[var(--color-text-main)]">Domain access</h4>
      <form className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={onCreateDomainInvite}>
        <Input
          aria-label="Allowed email domain"
          placeholder="example.com"
          value={newDomain}
          onChange={(event) => onNewDomainChange(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={!newDomain.trim() || submittingDomain}
        >
          <Globe2 className="mr-1.5 h-4 w-4" />
          Add domain
        </Button>
      </form>
      <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
        {domainInvites.length === 0 ? (
          <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">
            No domain access.
          </p>
        ) : (
          domainInvites.map((invite) => (
            <div
              key={invite.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 last:border-b-0"
            >
              <span className="truncate text-sm text-[var(--color-text-main)]">
                @{invite.domain}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${workspaceRoleBadgeClass(invite.role)}`}>
                {formatWorkspaceRole(invite.role)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRevokingDomainInvite(invite.id)}
                onClick={() => onRevokeDomainInvite(invite.id)}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
