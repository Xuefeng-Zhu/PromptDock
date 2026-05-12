import type { Workspace } from '../../types/index';

type WorkspaceIdentity = Pick<Workspace, 'id' | 'name'>;

interface WorkspaceColorMarkProps {
  className?: string;
  size?: 'sm' | 'md';
  workspace?: WorkspaceIdentity | null;
}

const WORKSPACE_PALETTES = [
  {
    shell: 'border-sky-200 bg-sky-50',
    primary: 'bg-sky-500',
    accent: 'bg-cyan-300',
  },
  {
    shell: 'border-emerald-200 bg-emerald-50',
    primary: 'bg-emerald-500',
    accent: 'bg-lime-300',
  },
  {
    shell: 'border-amber-200 bg-amber-50',
    primary: 'bg-amber-500',
    accent: 'bg-orange-300',
  },
  {
    shell: 'border-rose-200 bg-rose-50',
    primary: 'bg-rose-500',
    accent: 'bg-pink-300',
  },
  {
    shell: 'border-violet-200 bg-violet-50',
    primary: 'bg-violet-500',
    accent: 'bg-fuchsia-300',
  },
  {
    shell: 'border-indigo-200 bg-indigo-50',
    primary: 'bg-indigo-500',
    accent: 'bg-blue-300',
  },
  {
    shell: 'border-teal-200 bg-teal-50',
    primary: 'bg-teal-500',
    accent: 'bg-emerald-300',
  },
  {
    shell: 'border-red-200 bg-red-50',
    primary: 'bg-red-500',
    accent: 'bg-amber-300',
  },
] as const;

const SIZE_CLASS = {
  sm: 'h-4 w-4 rounded',
  md: 'h-5 w-5 rounded-md',
} as const;

function hashWorkspace(workspace?: WorkspaceIdentity | null): number {
  const seed = `${workspace?.id ?? ''}:${workspace?.name ?? 'Workspace'}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function WorkspaceColorMark({
  className = '',
  size = 'md',
  workspace,
}: WorkspaceColorMarkProps) {
  const palette = WORKSPACE_PALETTES[hashWorkspace(workspace) % WORKSPACE_PALETTES.length];
  const accentClass = size === 'sm' ? 'h-1.5 w-1.5 rounded-sm' : 'h-2 w-2 rounded-sm';

  return (
    <span
      aria-hidden="true"
      className={[
        'relative inline-flex shrink-0 overflow-hidden border',
        SIZE_CLASS[size],
        palette.shell,
        className,
      ].join(' ')}
      data-testid="workspace-color-mark"
    >
      <span className={`absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full ${palette.primary}`} />
      <span className={`absolute bottom-0.5 right-0.5 ${accentClass} ${palette.accent}`} />
    </span>
  );
}
