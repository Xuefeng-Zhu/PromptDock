import { useCallback, useRef } from 'react';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Search input wired to PromptStore.setSearchQuery.
 * Filters results as the user types.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative">
      {/* Search icon */}
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      >
        🔍
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search prompts…"
        aria-label="Search prompts"
        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
