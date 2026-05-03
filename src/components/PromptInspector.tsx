import type { PromptRecipe, Folder } from '../types/index';
import { PromptBodySection } from './prompt-inspector/PromptBodySection';
import { PromptInspectorHeader } from './prompt-inspector/PromptInspectorHeader';
import { PromptMetadataSection } from './prompt-inspector/PromptMetadataSection';
import { PromptTagsSection } from './prompt-inspector/PromptTagsSection';
import { PromptVariablesSection } from './prompt-inspector/PromptVariablesSection';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PromptInspectorProps {
  prompt: PromptRecipe;
  folder?: Folder;
  variables: string[];
  onToggleFavorite?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopyBody?: (body: string, promptId?: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PromptInspector({ prompt, folder, variables, onToggleFavorite, onEdit, onDuplicate, onArchive, onDelete, onCopyBody }: PromptInspectorProps) {
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
        <PromptTagsSection prompt={prompt} onEdit={onEdit} />
        <PromptMetadataSection prompt={prompt} folder={folder} />
        <PromptBodySection prompt={prompt} onCopyBody={onCopyBody} />
        <PromptVariablesSection variables={variables} />
      </div>
    </aside>
  );
}
