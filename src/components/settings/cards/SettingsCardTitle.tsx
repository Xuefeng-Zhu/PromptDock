interface SettingsCardTitleProps {
  children: string;
}

export function SettingsCardTitle({ children }: SettingsCardTitleProps) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
      {children}
    </h3>
  );
}
