import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { OnboardingScreen } from '../OnboardingScreen';
import { AppChrome } from './AppChrome';
import { AppInspectorPane } from './AppInspectorPane';
import { AppOverlays } from './AppOverlays';
import { AppScreenRouter } from './AppScreenRouter';
import { AppSidebar } from './AppSidebar';

type AppShellController = ReturnType<typeof useAppShellController>;

interface AppShellViewProps {
  controller: AppShellController;
}

export function AppShellView({ controller }: AppShellViewProps) {
  const {
    activeSidebarItem,
    authService,
    handleAuthSuccess,
    handleCommandPaletteOpen,
    handleConflictBadgeClick,
    handleCreateFolder,
    handleOnboardingComplete,
    handleSearchChange,
    handleSettingsOpen,
    handleSidebarItemSelect,
    handleSignOutSuccess,
    handleToggleTheme,
    libraryData,
    mode,
    screen,
    searchQuery,
    syncService,
    syncStatus,
    theme,
    unresolvedConflictCount,
    userId,
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
      <AppChrome
        authService={authService}
        mode={mode}
        userId={userId}
        searchQuery={searchQuery}
        syncStatus={syncStatus}
        unresolvedConflictCount={unresolvedConflictCount}
        onAuthSuccess={handleAuthSuccess}
        onCommandPaletteOpen={handleCommandPaletteOpen}
        onConflictBadgeClick={handleConflictBadgeClick}
        onSearchChange={handleSearchChange}
        onSignOutSuccess={handleSignOutSuccess}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar
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
        <AppInspectorPane controller={controller} />
      </div>

      <AppOverlays controller={controller} />
    </div>
  );
}
