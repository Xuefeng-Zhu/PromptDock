import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { ToastContainer } from '../feedback';
import { CommandPalette } from '../prompt-search';
import { FolderDeleteConfirmationDialog } from '../sidebar/FolderDeleteConfirmationDialog';
import { VariableFillModal } from '../variable-fill';

type AppShellController = ReturnType<typeof useAppShellController>;

interface AppOverlaysProps {
  controller: AppShellController;
}

export function AppOverlays({ controller }: AppOverlaysProps) {
  const {
    defaultAction,
    handleCommandPaletteClose,
    handleCommandPaletteSelect,
    handleFolderDeleteCancel,
    handleFolderDeleteConfirm,
    handleVariableFillCancel,
    handleVariableFillCopy,
    handleVariableFillPaste,
    libraryData,
    folderDeleteConfirmation,
    prompts,
  } = controller;

  return (
    <>
      <CommandPalette
        prompts={prompts}
        isOpen={controller.commandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSelectPrompt={handleCommandPaletteSelect}
      />

      {libraryData.variableFillPrompt && libraryData.variableFillVariables.length > 0 && (
        <VariableFillModal
          prompt={libraryData.variableFillPrompt}
          variables={libraryData.variableFillVariables}
          onCancel={handleVariableFillCancel}
          defaultAction={defaultAction}
          onCopy={handleVariableFillCopy}
          onPaste={handleVariableFillPaste}
        />
      )}

      {folderDeleteConfirmation && (
        <FolderDeleteConfirmationDialog
          folder={folderDeleteConfirmation.folder}
          promptCount={folderDeleteConfirmation.promptCount}
          onCancel={handleFolderDeleteCancel}
          onConfirm={handleFolderDeleteConfirm}
        />
      )}

      <ToastContainer />
    </>
  );
}
