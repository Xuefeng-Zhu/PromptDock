import type { KeyboardEvent, RefObject } from 'react';
import { QuickLauncherError } from './QuickLauncherError';

interface QuickLauncherSearchInputProps {
  actionError: string | null;
  query: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onQueryChange: (query: string) => void;
}

export function QuickLauncherSearchInput({
  actionError,
  query,
  searchInputRef,
  onKeyDown,
  onQueryChange,
}: QuickLauncherSearchInputProps) {
  return (
    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <input
        ref={searchInputRef}
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search prompts…"
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        aria-label="Search prompts"
        autoFocus
      />
      <QuickLauncherError message={actionError} variant="inline" />
    </div>
  );
}
