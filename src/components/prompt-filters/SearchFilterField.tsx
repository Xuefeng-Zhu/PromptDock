import { Search } from 'lucide-react';

interface SearchFilterFieldProps {
  query: string;
  onChange: (query: string) => void;
}

export function SearchFilterField({ query, onChange }: SearchFilterFieldProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 focus-within:border-[var(--color-primary)]">
      <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Title or keywords"
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-placeholder)]"
        aria-label="Search title or keywords"
      />
    </div>
  );
}
