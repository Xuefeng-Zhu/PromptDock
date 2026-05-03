import type { Folder, PromptRecipe } from '../../types/index';
import { formatDate, formatRelativeShort } from '../../utils/date-format';
import { EditorFolderField } from '../prompt-editor/EditorFolderField';

interface PromptMetadataSectionProps {
  folder?: Folder;
  folders?: Folder[];
  onCreateFolder?: (name: string) => Folder | void;
  onUpdateFolder?: (id: string, folderId: string | null) => void;
  prompt: PromptRecipe;
}

export function PromptMetadataSection({
  folder,
  folders = [],
  onCreateFolder,
  onUpdateFolder,
  prompt,
}: PromptMetadataSectionProps) {
  const folderOptions = [
    { value: '', label: 'No folder' },
    ...folders.map((item) => ({ value: item.id, label: item.name })),
  ];

  return (
    <div className="px-5 pb-4 space-y-2.5">
      <MetadataRow label="Last used" value={formatRelativeShort(prompt.lastUsedAt)} />
      <MetadataRow label="Created" value={formatDate(prompt.createdAt)} />
      <MetadataRow label="Updated" value={formatDate(prompt.updatedAt)} />
      {onUpdateFolder ? (
        <div className="pt-1">
          <EditorFolderField
            folderId={prompt.folderId}
            folderOptions={folderOptions}
            onCreateFolder={onCreateFolder}
            onFolderChange={(folderId) => onUpdateFolder(prompt.id, folderId)}
          />
        </div>
      ) : (
        folder && <MetadataRow label="Folder" value={folder.name} />
      )}
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-main)]">{value}</span>
    </div>
  );
}
