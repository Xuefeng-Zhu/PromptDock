import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { ConflictBadge } from '../../screens/ConflictCenter';
import { OnboardingScreen } from '../OnboardingScreen';
import { PromptInspector } from '../PromptInspector';
import { Sidebar } from '../Sidebar';
import { TopBar } from '../TopBar';
import { AppOverlays } from './AppOverlays';
import { AppScreenRouter } from './AppScreenRouter';

type AppShellController = ReturnType<typeof useAppShellController>;

interface AppShellViewProps {
  controller: AppShellController;
}

export function AppShellView({ controller }: AppShellViewProps) {
  const {
    activeSidebarItem,
    authService,
    handleAuthSuccess,
    handleArchivePrompt,
    handleCommandPaletteOpen,
    handleConflictBadgeClick,
    handleCopyPromptBody,
    handleCreateFolder,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleEditPrompt,
    handleOnboardingComplete,
    handleSearchChange,
    handleSettingsOpen,
    handleSidebarItemSelect,
    handleSignOutSuccess,
    handleToggleTheme,
    handleToggleFavorite,
    libraryData,
    mode,
    screen,
    searchQuery,
    syncService,
    syncStatus,
    theme,
    unresolvedConflictCount,
    userId,
    showInspector,
  } = controller;

  if (screen.name === 'onboarding') {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          authService={authService}
          syncService={syncService}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCommandPaletteOpen={handleCommandPaletteOpen}
        authService={authService}
        mode={mode}
        userId={userId}
        onAuthSuccess={handleAuthSuccess}
        onSignOutSuccess={handleSignOutSuccess}
        syncStatus={syncStatus}
      />

      {unresolvedConflictCount > 0 && (
        <div className="fixed top-0 right-32 z-50 flex h-14 items-center">
          <ConflictBadge
            count={unresolvedConflictCount}
            onClick={handleConflictBadgeClick}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          folders={libraryData.derivedFolders}
          activeItem={activeSidebarItem}
          onItemSelect={handleSidebarItemSelect}
          promptCountByFolder={libraryData.promptCountByFolder}
          totalPromptCount={libraryData.sidebarFilterCounts.total}
          favoriteCount={libraryData.sidebarFilterCounts.favorites}
          recentCount={libraryData.sidebarFilterCounts.recent}
          archivedCount={libraryData.sidebarFilterCounts.archived}
          tagCounts={libraryData.sidebarTagCounts}
          onSettingsOpen={handleSettingsOpen}
          onToggleTheme={handleToggleTheme}
          onCreateFolder={handleCreateFolder}
          theme={theme}
        />

        <AppScreenRouter controller={controller} />

        {showInspector && libraryData.selectedPrompt && (
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
        )}
      </div>

      <AppOverlays controller={controller} />
    </div>
  );
}
