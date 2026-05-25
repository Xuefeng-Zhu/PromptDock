import type { Folder } from '../../types/index';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

interface FolderDeleteConfirmationDialogProps {
  folder: Folder;
  onCancel: () => void;
  onConfirm: () => void | Promise<unknown>;
  promptCount: number;
}

function formatPromptCount(count: number): string {
  return `${count} prompt${count === 1 ? '' : 's'}`;
}

export function FolderDeleteConfirmationDialog({
  folder,
  onCancel,
  onConfirm,
  promptCount,
}: FolderDeleteConfirmationDialogProps) {
  const description = promptCount > 0
    ? `${formatPromptCount(promptCount)} will stay in your library and move to No folder.`
    : 'This folder is empty.';

  return (
    <ConfirmationDialog
      confirmLabel="Delete folder"
      description={description}
      idPrefix="delete-folder"
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={<>Delete "{folder.name}"?</>}
      zIndexClassName="z-[90]"
    />
  );
}
