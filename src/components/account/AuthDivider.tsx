export function AuthDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'my-3 flex items-center gap-2' : 'my-4 flex items-center gap-3'}>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        or
      </span>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}
