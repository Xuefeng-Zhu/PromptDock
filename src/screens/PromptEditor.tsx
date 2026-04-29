import { useState, useEffect } from 'react';
import { usePromptStore } from '../stores/prompt-store';
import type { PromptRecipe } from '../types';

interface Props {
  promptId: string | null;
  onBack: () => void;
}

export function PromptEditor({ promptId, onBack }: Props) {
  const { prompts, createPrompt, updatePrompt } = usePromptStore();
  const existing = promptId && promptId !== 'new' ? prompts.find((p) => p.id === promptId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setBody(existing.body);
      setTagsInput(existing.tags.join(', '));
    }
  }, [existing]);

  const handleSave = async () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (existing) {
      await updatePrompt(existing.id, { title, description, body, tags });
    } else {
      await createPrompt({
        workspaceId: 'local', title, description, body, tags,
        folderId: null, favorite: false, archived: false, archivedAt: null,
        lastUsedAt: null, createdBy: 'local', version: 1,
      });
    }
    onBack();
  };

  // Highlight {{variables}} in body
  const highlightedBody = body.replace(
    /\{\{([^}]+)\}\}/g,
    '<span class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{{$1}}</span>'
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onBack} className="text-blue-600 hover:underline">← Back</button>
        <h2 className="font-bold">{existing ? 'Edit Prompt' : 'New Prompt'}</h2>
        <button onClick={handleSave} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-1">Body</label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono" />
          {body.includes('{{') && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: highlightedBody.replace(/\n/g, '<br/>') }} />
          )}
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
