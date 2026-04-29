import { useState, useEffect, useRef } from 'react';
import { usePromptStore } from '../stores/prompt-store';
import { VariableParser } from '../services/variable-parser';
import { VariableFillModal } from '../components/VariableFillModal';
import type { PromptRecipe } from '../types';

const parser = new VariableParser();

export function QuickLauncherWindow() {
  const [query, setQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecipe | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { filteredPrompts, setSearchQuery, loadPrompts } = usePromptStore();

  useEffect(() => {
    loadPrompts();
    inputRef.current?.focus();
  }, [loadPrompts]);

  useEffect(() => { setSearchQuery(query); }, [query, setSearchQuery]);

  const results = filteredPrompts();

  const handleSelect = (prompt: PromptRecipe) => {
    const vars = parser.parse(prompt.body);
    if (vars.length > 0) {
      setSelectedPrompt(prompt);
    } else {
      navigator.clipboard.writeText(prompt.body);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedPrompt) setSelectedPrompt(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" onKeyDown={handleKeyDown}>
      <div className="p-3">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search prompts"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <span className="flex-1 truncate font-medium">{p.title}</span>
            {p.tags.length > 0 && (
              <span className="text-xs text-gray-400">{p.tags[0]}</span>
            )}
          </button>
        ))}
      </div>
      {selectedPrompt && (
        <VariableFillModal
          prompt={selectedPrompt}
          onCopy={(text) => { navigator.clipboard.writeText(text); }}
          onPaste={(text) => { navigator.clipboard.writeText(text); }}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}
