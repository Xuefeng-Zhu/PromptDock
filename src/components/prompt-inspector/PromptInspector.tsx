import type { PromptRecipe, Folder } from '../../types/index';
import { PromptBodySection } from './PromptBodySection';
import { PromptInspectorHeader } from './PromptInspectorHeader';
import { PromptFolderSection, PromptMetadataSection } from './PromptMetadataSection';
import { PromptTagsSection } from './PromptTagsSection';
import { PromptVariablesSection } from './PromptVariablesSection';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptInspectorProps {
  availableTags?: string[];
  prompt: PromptRecipe;
  folder?: Folder;
  folders?: Folder[];
  variables: string[];
  onToggleFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onCreateFolder?: (name: string) => Folder | void | Promise<Folder | void>;
  onDelete?: (id: string) => void;
  onCopyBody?: (body: string, promptId?: string) => void;
  onUpdateFolder?: (id: string, folderId: string | null) => void;
  onUpdateTags?: (id: string, updateTags: (tags: string[]) => string[]) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PromptInspector({
  availableTags = [],
  prompt,
  folder,
  folders = [],
  variables,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onArchive,
  onCreateFolder,
  onDelete,
  onCopyBody,
  onUpdateFolder,
  onUpdateTags,
}: PromptInspectorProps) {
  return (
    <aside
      className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden"
      aria-label="Prompt details"
    >
      <div className="flex-1 overflow-y-auto">
        <PromptInspectorHeader
          prompt={prompt}
          onArchive={onArchive}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
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
