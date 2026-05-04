import type { ChangeEventHandler, RefObject } from 'react';
import { Search } from 'lucide-react';

interface CommandPaletteSearchFieldProps {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export function CommandPaletteSearchField({
  inputRef,
  query,
  onChange,
}: CommandPaletteSearchFieldProps) {
  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <Search
        className="h-5 w-5 shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={onChange}
        placeholder="Search prompts…"
        aria-label="Search prompts"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-placeholder)]"
        style={{ color: 'var(--color-text-main)' }}
      />
    </div>
  );
}
