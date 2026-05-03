import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { LibraryViewMode } from './types';

interface LibraryHeaderProps {
  displayCount: number;
  onNewPrompt: () => void;
  onViewModeChange: (viewMode: LibraryViewMode) => void;
  viewMode: LibraryViewMode;
}

export function LibraryHeader({
  displayCount,
  onNewPrompt,
  onViewModeChange,
  viewMode,
}: LibraryHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-[var(--color-text-main)]">
          All Prompts
        </h1>
        <span className="text-sm text-[var(--color-text-muted)]">
          {displayCount} prompts
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={onNewPrompt}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Prompt
        </Button>
      </div>
    </div>
  );
}

interface ViewModeToggleProps {
  onViewModeChange: (viewMode: LibraryViewMode) => void;
  viewMode: LibraryViewMode;
}

function ViewModeToggle({ onViewModeChange, viewMode }: ViewModeToggleProps) {
  return (
    <div
      className="flex rounded-lg border border-[var(--color-border)]"
      role="group"
      aria-label="View mode"
    >
      <button
        onClick={() => onViewModeChange('grid')}
        className={[
          'flex items-center justify-center rounded-l-lg p-2 transition-colors',
          viewMode === 'grid'
            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
            : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
        ].join(' ')}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={[
          'flex items-center justify-center rounded-r-lg border-l border-[var(--color-border)] p-2 transition-colors',
          viewMode === 'list'
            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
            : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:bg-gray-50',
        ].join(' ')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
