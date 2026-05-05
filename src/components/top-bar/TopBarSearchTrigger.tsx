import { Search } from 'lucide-react';

interface TopBarSearchTriggerProps {
  onCommandPaletteOpen: () => void;
}

export function TopBarSearchTrigger({
  onCommandPaletteOpen,
}: TopBarSearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onCommandPaletteOpen}
      aria-label="Open command palette"
      aria-keyshortcuts="Meta+K Control+K"
      className="group flex h-9 w-full max-w-md items-center gap-2 rounded-lg border px-3 text-left text-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      style={{
        backgroundColor: 'var(--color-background)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    >
      <Search
        className="h-4 w-4 shrink-0"
        style={{ color: 'var(--color-text-placeholder)' }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">Search prompts</span>
      <kbd
        className="shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-panel)',
        }}
      >
        ⌘K
      </kbd>
    </button>
  );
}
