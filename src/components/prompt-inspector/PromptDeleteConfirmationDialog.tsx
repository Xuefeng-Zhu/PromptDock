import { ConfirmationDialog } from '../ui/ConfirmationDialog';

interface PromptDeleteConfirmationDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
  promptTitle: string;
}

export function PromptDeleteConfirmationDialog({
  onCancel,
  onConfirm,
  promptTitle,
}: PromptDeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      confirmLabel="Delete permanently"
      description="This cannot be undone. Archive the prompt instead if you might need it later."
      idPrefix="delete-prompt"
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={<>Delete "{promptTitle}" permanently?</>}
    />
  );
}
