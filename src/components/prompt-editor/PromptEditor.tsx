import type { Folder, PromptRecipe } from '../../types/index';
import { usePromptEditorForm } from '../../hooks/use-prompt-editor-form';
import { BodyTemplateEditor } from './BodyTemplateEditor';
import { LivePreviewPanel } from './LivePreviewPanel';
import { PromptBasicsFields } from './PromptBasicsFields';
import { PromptEditorHeader } from './PromptEditorHeader';
import { PromptMetadataFooter } from './PromptMetadataFooter';

export { extractVariables } from '../../utils/prompt-template';
export { countChars, countWords } from '../../utils/text-counts';

export interface PromptEditorProps {
  promptId?: string;
  prompt?: PromptRecipe;
  availableTags?: string[];
  folders: Folder[];
  onCreateFolder?: (name: string) => Folder | void | Promise<Folder | void>;
  onSave: (data: Partial<PromptRecipe>) => void | Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onCopy?: (body: string) => void;
}

export function PromptEditor({
  promptId,
  prompt,
  availableTags = [],
  folders,
  onCreateFolder,
  onSave,
  onCancel,
  onDirtyChange,
  onDuplicate,
  onArchive,
  onCopy,
}: PromptEditorProps) {
  const form = usePromptEditorForm({
    availableTags,
    folders,
    onDirtyChange,
    onSave,
    prompt,
    promptId,
  });

  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-background)]">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className={form.isEditorExpanded ? 'mx-auto w-full px-4 py-6 sm:px-8' : 'mx-auto w-full max-w-4xl px-4 py-6 sm:px-8'}>
          <PromptEditorHeader
            currentFolderName={form.currentFolder?.name}
            isEditing={form.isEditing}
            isSaving={form.isSaving}
            onArchive={onArchive}
            onCancel={onCancel}
            onDuplicate={onDuplicate}
            onSave={() => void form.savePrompt()}
            promptTitle={prompt?.title}
          />

          {form.validationError && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {form.validationError}
            </div>
          )}

          <PromptBasicsFields
            availableTags={availableTags}
            description={form.description}
            favorite={form.favorite}
            folderId={form.folderId}
            folderOptions={form.folderOptions}
            onAddTag={form.handleAddTag}
            onDescriptionChange={form.setDescription}
            onFavoriteChange={form.setFavorite}
            onCreateFolder={onCreateFolder}
            onFolderChange={form.setFolderId}
            onRemoveTag={form.handleRemoveTag}
            onSelectTag={form.handleSelectTag}
            onShowTagInputChange={form.setShowTagInput}
            onTagInputChange={form.setTagInput}
            onTagKeyDown={form.handleTagKeyDown}
            onTitleChange={form.setTitle}
            showTagInput={form.showTagInput}
            tagInput={form.tagInput}
            tags={form.tags}
            title={form.title}
          />

          <BodyTemplateEditor
            body={form.body}
            charCount={form.charCount}
            isExpanded={form.isEditorExpanded}
            showFormattingHelp={form.showFormattingHelp}
            wordCount={form.wordCount}
            onBodyChange={form.setBody}
            onCopyPrompt={onCopy ? () => onCopy(form.body) : undefined}
            onInsertVariable={form.handleInsertVariable}
            onToggleExpanded={() => form.setIsEditorExpanded((prev) => !prev)}
            onToggleFormattingHelp={() => form.setShowFormattingHelp((prev) => !prev)}
          />

          {form.isEditing && prompt && <PromptMetadataFooter prompt={prompt} />}
        </div>
      </div>

      {!form.isEditorExpanded && (
        <div className="hidden shrink-0 lg:block">
          <LivePreviewPanel
            body={form.body}
            renderedPreview={form.renderedPreview}
            variableValues={form.variableValues}
            variables={form.variables}
            onResetPreview={form.handleResetPreview}
            onVariableValueChange={form.handleVariableValueChange}
          />
        </div>
      )}
    </div>
  );
}
