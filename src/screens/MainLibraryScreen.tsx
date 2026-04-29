import { useEffect } from 'react';
import { usePromptStore } from '../stores/prompt-store';
import { SearchBar } from '../components/SearchBar';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { PromptCard } from '../components/PromptCard';

interface Props {
  onEditPrompt: (id: string) => void;
  onSelectPrompt: (id: string) => void;
  onNavigateSettings: () => void;
}

export function MainLibraryScreen({ onEditPrompt, onSelectPrompt, onNavigateSettings }: Props) {
  const { filteredPrompts, loadPrompts, duplicatePrompt, toggleFavorite, archivePrompt, favoriteFilter, setFavoriteFilter } = usePromptStore();

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const prompts = filteredPrompts();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">PromptDock</h1>
        <div className="flex items-center gap-4">
          <SyncStatusBar />
          <button onClick={onNavigateSettings} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" aria-label="Settings">⚙️</button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-2 items-center">
          <div className="flex-1"><SearchBar /></div>
          <button
            onClick={() => setFavoriteFilter(!favoriteFilter)}
            className={`px-3 py-2 rounded-lg border ${favoriteFilter ? 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900' : 'border-gray-300 dark:border-gray-600'}`}
            aria-label="Filter favorites"
          >
            ⭐
          </button>
          <button
            onClick={() => onEditPrompt('new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {prompts.length === 0 ? (
          <p className="text-center text-gray-400 mt-8">No prompts found</p>
        ) : (
          prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onSelect={onSelectPrompt}
              onEdit={onEditPrompt}
              onDuplicate={duplicatePrompt}
              onToggleFavorite={toggleFavorite}
              onArchive={archivePrompt}
            />
          ))
        )}
      </div>
    </div>
  );
}
