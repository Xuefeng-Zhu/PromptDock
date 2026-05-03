import type { AuthFormMode } from '../../hooks/use-auth-form';

interface AuthModeTabsProps {
  activeMode: AuthFormMode;
  compact: boolean;
  onSelectMode: (mode: AuthFormMode) => void;
}

export function AuthModeTabs({ activeMode, compact, onSelectMode }: AuthModeTabsProps) {
  return (
    <div className={compact ? 'mb-3 flex gap-2' : 'mb-4 flex gap-2'}>
      <AuthModeTab
        active={activeMode === 'sign-in'}
        compact={compact}
        label="Sign In"
        onClick={() => onSelectMode('sign-in')}
      />
      <AuthModeTab
        active={activeMode === 'sign-up'}
        compact={compact}
        label="Sign Up"
        onClick={() => onSelectMode('sign-up')}
      />
    </div>
  );
}

interface AuthModeTabProps {
  active: boolean;
  compact: boolean;
  label: string;
  onClick: () => void;
}

function AuthModeTab({ active, compact, label, onClick }: AuthModeTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md px-3 py-1.5 font-medium transition-colors',
        compact ? 'text-xs' : 'text-sm',
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-text-muted)] hover:bg-gray-100',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
