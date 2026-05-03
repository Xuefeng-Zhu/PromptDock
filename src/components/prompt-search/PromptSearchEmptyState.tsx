interface PromptSearchEmptyStateProps {
  children: string;
  variant: 'palette' | 'launcher';
}

export function PromptSearchEmptyState({ children, variant }: PromptSearchEmptyStateProps) {
  if (variant === 'launcher') {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        {children}
      </div>
    );
  }

  return (
    <li
      className="px-4 py-6 text-center text-sm"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </li>
  );
}
