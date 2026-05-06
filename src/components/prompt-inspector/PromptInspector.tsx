import type { PromptRecipe, Folder } from '../../types/index';
import { PromptBodySection } from './PromptBodySection';
import { PromptInspectorHeader } from './PromptInspectorHeader';
import { PromptFolderSection, PromptMetadataSection } from './PromptMetadataSection';
import { PromptTagsSection } from './PromptTagsSection';
import { PromptVariablesSection } from './PromptVariablesSection';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptInspectorProps {
  ariaLabel?: string;
  availableTags?: string[];
  prompt: PromptRecipe;
  folder?: Folder;
  folders?: Folder[];
  variables: string[];
  onToggleFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onCreateFolder?: (name: string) => Folder | void;
  onDelete?: (id: string) => void;
  onCopyBody?: (body: string, promptId?: string) => void;
  onClose?: () => void;
  onUpdateFolder?: (id: string, folderId: string | null) => void;
  onUpdateTags?: (id: string, updateTags: (tags: string[]) => string[]) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PromptInspector({
  ariaLabel = 'Prompt details',
  availableTags = [],
  prompt,
  folder,
  folders = [],
  variables,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onCreateFolder,
  onDelete,
  onCopyBody,
  onClose,
  onUpdateFolder,
  onUpdateTags,
}: PromptInspectorProps) {
  return (
    <aside
      className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden"
      aria-label={ariaLabel}
    >
      <div className="flex-1 overflow-y-auto">
        <PromptInspectorHeader
          prompt={prompt}
          onArchive={onArchive}
          onDelete={onDelete}
          onRestore={onRestore}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onClose={onClose}
          onToggleFavorite={onToggleFavorite}
        />
        <PromptFolderSection
          prompt={prompt}
          folder={folder}
          folders={folders}
          onCreateFolder={onCreateFolder}
          onUpdateFolder={onUpdateFolder}
        />
        <PromptTagsSection
          availableTags={availableTags}
          prompt={prompt}
          onEdit={onEdit}
          onUpdateTags={onUpdateTags}
        />
        <PromptMetadataSection prompt={prompt} />
        <PromptBodySection prompt={prompt} onCopyBody={onCopyBody} />
        <PromptVariablesSection variables={variables} />
      </div>
    </aside>
  );
}
