import { Search } from 'lucide-react';

interface TopBarSearchTriggerProps {
  onCommandPaletteOpen: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function TopBarSearchTrigger({
  onCommandPaletteOpen,
  onSearchChange,
  searchQuery,
}: TopBarSearchTriggerProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: 'var(--color-text-placeholder)' }}
        aria-hidden="true"
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        onClick={onCommandPaletteOpen}
        placeholder="Search…"
        aria-label="Search prompts"
        className="w-full rounded-lg border py-1.5 pl-9 pr-14 text-sm outline-none transition-colors"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
      />
      <kbd
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs font-medium"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-panel)',
        }}
      >
        ⌘K
      </kbd>
    </div>
  );
}
