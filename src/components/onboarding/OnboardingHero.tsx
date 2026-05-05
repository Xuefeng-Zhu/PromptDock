import { Braces, ClipboardCopy, Lock, Terminal } from 'lucide-react';

export function OnboardingHero() {
  return (
    <section className="w-full min-w-0 space-y-6 text-center lg:text-left">
      <div className="flex flex-col items-center gap-5 lg:items-start">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] shadow-sm">
            <Terminal size={26} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--color-text-main)]">
              PromptDock
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Prompt recipe manager
            </p>
          </div>
        </div>

        <div className="max-w-xl min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-[var(--color-text-main)] sm:text-4xl">
            Welcome to PromptDock
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)] sm:text-base sm:leading-7">
            Capture reusable prompt recipes, fill variables, and keep your best
            AI workflows ready wherever you write.
          </p>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
          <div className="text-left">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              Recipe preview
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text-main)]">
              Launch update
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-primary)] dark:bg-blue-950/60 dark:text-blue-300">
            <ClipboardCopy size={18} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left dark:border-gray-700 dark:bg-gray-800">
          <p className="break-words text-xs leading-6 text-[var(--color-text-muted)]">
            Write a crisp update for{' '}
            <span className="font-mono text-[var(--color-text-main)]">
              {'{{project}}'}
            </span>{' '}
            covering wins, blockers, and next steps for{' '}
            <span className="font-mono text-[var(--color-text-main)]">
              {'{{audience}}'}
            </span>
            .
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {['project', 'audience'].map((variable) => (
            <span
              key={variable}
              className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
            >
              <Braces size={12} />
              {variable}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OnboardingPrivacyFooter() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] lg:justify-start">
      <Lock size={12} />
      Private by design. You're in control.
    </p>
  );
}
