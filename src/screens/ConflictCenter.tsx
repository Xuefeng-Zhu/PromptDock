/**
 * ConflictCenter — UI screen for reviewing and resolving prompt sync conflicts.
 *
 * Displays a list of unresolved PromptConflict documents with side-by-side
 * comparison of local and remote versions. Provides "Keep Local" and
 * "Keep Remote" resolution actions.
 *
 * Only visible in Synced Mode.
 *
 * Requirements: 18.2, 18.3, 18.4, 18.5
 */

import { useState, useCallback, useRef, useSyncExternalStore } from 'react';
import type { PromptConflict, PromptRecipe } from '../types/index';
import type { ConflictService } from '../services/conflict-service';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ConflictCenterProps {
  /** The ConflictService instance managing conflicts. */
  conflictService: ConflictService;
  /** Called when a conflict is resolved with the winning version. */
  onResolve?: (promptId: string, resolvedVersion: PromptRecipe) => void;
  /** Called when the user wants to go back to the library. */
  onBack?: () => void;
}

// ─── ConflictBadge ─────────────────────────────────────────────────────────────

export interface ConflictBadgeProps {
  /** Number of unresolved conflicts. */
  count: number;
  /** Called when the badge is clicked. */
  onClick?: () => void;
}

/**
 * A small badge component that displays the number of unresolved conflicts.
 * Shown in the Main Library Screen header when conflicts exist.
 *
 * Requirement: 18.2
 */
export function ConflictBadge({ count, onClick }: ConflictBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
      aria-label={`${count} unresolved conflict${count !== 1 ? 's' : ''}`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      {count} Conflict{count !== 1 ? 's' : ''}
    </button>
  );
}

// ─── VersionPanel ──────────────────────────────────────────────────────────────

interface VersionPanelProps {
  label: string;
  version: PromptRecipe;
  accentColor: 'blue' | 'green';
}

function VersionPanel({ label, version, accentColor }: VersionPanelProps) {
  const borderColor =
    accentColor === 'blue'
      ? 'border-blue-300 dark:border-blue-700'
      : 'border-green-300 dark:border-green-700';
  const headerBg =
    accentColor === 'blue'
      ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300';

  return (
    <div className={`flex-1 rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${headerBg}`}>
        {label}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</span>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{version.title}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {version.description || '(no description)'}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Body</span>
          <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {version.body}
          </pre>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>Version: {version.version}</span>
          <span>Updated: {version.updatedAt.toLocaleString()}</span>
        </div>
        {version.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {version.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ConflictItem ──────────────────────────────────────────────────────────────

interface ConflictItemProps {
  conflict: PromptConflict;
  onKeepLocal: (conflictId: string) => void;
  onKeepRemote: (conflictId: string) => void;
}

function ConflictItem({ conflict, onKeepLocal, onKeepRemote }: ConflictItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
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

      {/* Side-by-side diff */}
      {expanded && (
        <div className="flex gap-3 p-4">
          <VersionPanel label="Local Version" version={conflict.localVersion} accentColor="blue" />
          <VersionPanel
            label="Remote Version"
            version={conflict.remoteVersion}
            accentColor="green"
          />
        </div>
      )}
    </div>
  );
}

// ─── ConflictCenter ────────────────────────────────────────────────────────────

/**
 * ConflictCenter screen — displays all unresolved conflicts with side-by-side
 * comparison and resolution actions.
 *
 * Requirements: 18.3, 18.4, 18.5
 */
export function ConflictCenter({ conflictService, onResolve, onBack }: ConflictCenterProps) {
  // Subscribe to conflict service changes for reactive updates.
  // Cache the snapshot to avoid infinite re-render loops — useSyncExternalStore
  // requires referential stability from getSnapshot.
  const cachedConflicts = useRef<PromptConflict[]>([]);
  const conflicts = useSyncExternalStore(
    useCallback((cb: () => void) => conflictService.subscribe(cb), [conflictService]),
    () => {
      const next = conflictService.getUnresolvedConflicts();
      // Only return a new reference if the data actually changed
      if (
        next.length !== cachedConflicts.current.length ||
        next.some((c, i) => c.id !== cachedConflicts.current[i]?.id || c.resolvedAt !== cachedConflicts.current[i]?.resolvedAt)
      ) {
        cachedConflicts.current = next;
      }
      return cachedConflicts.current;
    },
  );

  const handleKeepLocal = useCallback(
    (conflictId: string) => {
      const resolved = conflictService.resolveKeepLocal(conflictId);
      if (resolved) {
        onResolve?.(resolved.id, resolved);
      }
    },
    [conflictService, onResolve],
  );

  const handleKeepRemote = useCallback(
    (conflictId: string) => {
      const resolved = conflictService.resolveKeepRemote(conflictId);
      if (resolved) {
        onResolve?.(resolved.id, resolved);
      }
    },
    [conflictService, onResolve],
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Back to library"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Conflict Center</h1>
          {conflicts.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {conflicts.length} unresolved
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-3 h-12 w-12 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No conflicts to resolve
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              All your prompts are in sync.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <ConflictItem
                key={conflict.id}
                conflict={conflict}
                onKeepLocal={handleKeepLocal}
                onKeepRemote={handleKeepRemote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
