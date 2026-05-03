import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { PromptInspector } from '../PromptInspector';

type AppShellController = ReturnType<typeof useAppShellController>;

interface AppInspectorPaneProps {
  controller: AppShellController;
}

export function AppInspectorPane({ controller }: AppInspectorPaneProps) {
  const {
    handleArchivePrompt,
    handleCopyPromptBody,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleEditPrompt,
    handleToggleFavorite,
    libraryData,
    showInspector,
  } = controller;

  if (!showInspector || !libraryData.selectedPrompt) return null;

  return (
    <div className="w-80 shrink-0 overflow-y-auto pt-14">
      <PromptInspector
        prompt={libraryData.selectedPrompt}
        folder={libraryData.selectedPromptFolder}
        variables={libraryData.selectedPromptVariables}
        onToggleFavorite={handleToggleFavorite}
        onEdit={handleEditPrompt}
        onDuplicate={handleDuplicatePrompt}
        onArchive={handleArchivePrompt}
        onDelete={handleDeletePrompt}
        onCopyBody={handleCopyPromptBody}
      />
    </div>
  );
}
