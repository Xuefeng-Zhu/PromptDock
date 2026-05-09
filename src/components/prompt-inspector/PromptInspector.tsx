import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PromptRecipe, Folder } from '../../types/index';
import { PromptBodySection } from './PromptBodySection';
import { PromptInspectorHeader } from './PromptInspectorHeader';
import { PromptFolderSection, PromptMetadataSection } from './PromptMetadataSection';
import { PromptTagsSection } from './PromptTagsSection';
import { PromptVariablesSection } from './PromptVariablesSection';
import { renderPromptTemplate } from '../../utils/prompt-template';
import {
  createDefaultPromptVariable,
  resolvePromptRecipeVariables,
} from '../../utils/prompt-variables';

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
  onCreateFolder?: (name: string) => Folder | void | Promise<Folder | void>;
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
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setVariableValues({});
  }, [prompt.id]);

  const promptVariables = useMemo(() => {
    const resolvedVariables = resolvePromptRecipeVariables(prompt);
    if (resolvedVariables.length > 0) return resolvedVariables;

    return variables.map((variable) => createDefaultPromptVariable(variable));
  }, [prompt, variables]);

  const renderedPrompt = useMemo(() => {
    const values = Object.fromEntries(
      promptVariables.map((variable) => [
        variable.name,
        variableValues[variable.name] ?? variable.defaultValue,
      ]),
    );

    return renderPromptTemplate(prompt.body, values);
  }, [prompt.body, promptVariables, variableValues]);

  const handleVariableValueChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

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
        <PromptVariablesSection
          values={variableValues}
          variables={promptVariables}
          onVariableValueChange={handleVariableValueChange}
        />
        <PromptBodySection
          prompt={prompt}
          renderedBody={renderedPrompt}
          onCopyBody={onCopyBody}
        />
      </div>
    </aside>
  );
}
