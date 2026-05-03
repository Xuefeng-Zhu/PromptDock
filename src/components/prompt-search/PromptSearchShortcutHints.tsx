const HINTS = [
  { keys: '↑↓', label: 'navigate' },
  { keys: 'Enter', label: 'select' },
  { keys: 'Esc', label: 'close' },
];

interface PromptSearchShortcutHintsProps {
  variant: 'palette' | 'launcher';
}

export function PromptSearchShortcutHints({ variant }: PromptSearchShortcutHintsProps) {
  if (variant === 'launcher') {
    return (
      <div className="border-t border-gray-200 px-4 py-1.5 dark:border-gray-700">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {HINTS.map((hint) => (
            <HintFragment
              key={hint.keys}
              hint={hint}
              kbdClassName="rounded border border-gray-300 px-1 dark:border-gray-600"
            />
          ))}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-4 border-t px-4 py-2 text-xs"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    >
      {HINTS.map((hint) => (
        <span key={hint.keys} className="flex items-center gap-1">
          <kbd
            className="rounded border px-1 py-0.5 text-[10px] font-mono"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
            }}
          >
            {hint.keys}
          </kbd>
          {hint.label}
        </span>
      ))}
    </div>
  );
}

interface HintFragmentProps {
  hint: { keys: string; label: string };
  kbdClassName: string;
}

function HintFragment({ hint, kbdClassName }: HintFragmentProps) {
  return (
    <>
      <kbd className={kbdClassName}>{hint.keys}</kbd>{' '}
      {hint.label}{' '}
    </>
  );
}
