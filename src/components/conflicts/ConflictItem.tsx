import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { PromptConflict } from '../../types/index';
import { PromptVersionPanel } from './PromptVersionPanel';

interface ConflictItemProps {
  conflict: PromptConflict;
  onKeepLocal: (conflictId: string) => void;
  onKeepRemote: (conflictId: string) => void;
}

export function ConflictItem({
  conflict,
  onKeepLocal,
  onKeepRemote,
}: ConflictItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {conflict.localVersion.title}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Detected {conflict.detectedAt.toLocaleString()}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onKeepLocal(conflict.id)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Keep Local
          </button>
          <button
            onClick={() => onKeepRemote(conflict.id)}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Keep Remote
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex gap-3 p-4">
          <PromptVersionPanel label="Local Version" version={conflict.localVersion} accentColor="blue" />
          <PromptVersionPanel
            label="Remote Version"
            version={conflict.remoteVersion}
            accentColor="green"
          />
        </div>
      )}
    </div>
  );
}
