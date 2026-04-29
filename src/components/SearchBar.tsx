import { usePromptStore } from '../stores/prompt-store';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = usePromptStore();
  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search prompts..."
      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Search prompts"
    />
  );
}
