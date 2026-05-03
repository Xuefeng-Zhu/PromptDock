import { ConflictCenter } from '../../screens/ConflictCenter';
import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { LibraryScreen } from '../library';
import { PromptEditor } from '../prompt-editor';
import { SettingsScreen } from '../settings';

type AppShellController = ReturnType<typeof useAppShellController>;

interface AppScreenRouterProps {
  controller: AppShellController;
}

export function AppScreenRouter({ controller }: AppScreenRouterProps) {
  const {
    activeFilter,
    authService,
    conflictService,
    editorPrompt,
    editorPromptId,
    handleConflictBack,
    handleConflictResolve,
    handleEditorArchive,
    handleEditorCancel,
    handleEditorCopy,
    handleEditorDuplicate,
    handleEditorSave,
    handleFilterChange,
    handleCreateFolder,
    handleNewPrompt,
    handleSelectPrompt,
    handleSettingsBack,
    handleToggleFavorite,
    libraryData,
    prompts,
    screen,
    selectedPromptId,
    setEditorHasUnsavedChanges,
  } = controller;

  return (
    <main
      className={[
        'flex min-h-0 flex-1 flex-col pt-14',
        screen.name === 'settings' ? 'overflow-hidden' : 'overflow-y-auto',
      ].join(' ')}
      style={{ color: 'var(--color-text-main)' }}
    >
      {screen.name === 'library' && (
        <LibraryScreen
          prompts={libraryData.filteredPrompts}
          filterSourcePrompts={prompts}
          folders={libraryData.derivedFolders}
          selectedPromptId={selectedPromptId}
          activeFilter={activeFilter}
          onSelectPrompt={handleSelectPrompt}
          onToggleFavorite={handleToggleFavorite}
          onFilterChange={handleFilterChange}
          onNewPrompt={handleNewPrompt}
          categoryColorMap={libraryData.categoryColorMap}
        />
      )}

      {screen.name === 'editor' && (
        <PromptEditor
          promptId={screen.promptId}
          prompt={editorPrompt}
          availableTags={libraryData.availableTags}
          folders={libraryData.derivedFolders}
          onCreateFolder={handleCreateFolder}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          onDirtyChange={setEditorHasUnsavedChanges}
          onDuplicate={editorPromptId ? handleEditorDuplicate : undefined}
          onArchive={editorPromptId ? handleEditorArchive : undefined}
          onCopy={handleEditorCopy}
        />
      )}

      {screen.name === 'settings' && (
        <SettingsScreen onBack={handleSettingsBack} authService={authService} />
      )}

      {screen.name === 'conflicts' && conflictService && (
        <ConflictCenter
          conflictService={conflictService}
          onResolve={handleConflictResolve}
          onBack={handleConflictBack}
        />
      )}
    </main>
  );
}
