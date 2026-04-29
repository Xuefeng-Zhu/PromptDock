import type { PromptConflict } from '../types';

interface Props {
  conflicts: PromptConflict[];
  onKeepLocal: (conflict: PromptConflict) => void;
  onKeepRemote: (conflict: PromptConflict) => void;
  onBack: () => void;
}

export function ConflictCenter({ conflicts, onKeepLocal, onKeepRemote, onBack }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onBack} className="text-blue-600 hover:underline">← Back</button>
        <h2 className="font-bold">Conflicts ({conflicts.length})</h2>
        <div />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conflicts.length === 0 ? (
          <p className="text-center text-gray-400 mt-8">No conflicts</p>
        ) : (
          conflicts.map((c) => (
            <div key={c.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-medium mb-2">{c.localVersion.title}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-600 mb-1">Local</p>
                  <p className="whitespace-pre-wrap bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{c.localVersion.body}</p>
                </div>
                <div>
                  <p className="font-medium text-green-600 mb-1">Remote</p>
                  <p className="whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 p-2 rounded">{c.remoteVersion.body}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onKeepLocal(c)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Keep Local</button>
                <button onClick={() => onKeepRemote(c)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Keep Remote</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
