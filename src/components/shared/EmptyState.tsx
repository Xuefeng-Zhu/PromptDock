import { Button } from '../ui/Button';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Centered placeholder for empty lists or screens. Displays an icon,
 * a title, a description, and an optional call-to-action button.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-[var(--color-text-placeholder)]">{icon}</div>
      <h3 className="text-base font-semibold text-[var(--color-text-main)]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
        {description}
      </p>
      {action && (
        <Button
          variant="primary"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
