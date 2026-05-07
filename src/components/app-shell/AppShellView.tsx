import { useEffect, useState } from 'react';
import type { useAppShellController } from '../../hooks/use-app-shell-controller';
import { ConflictBadge } from '../conflicts';
import { OnboardingScreen } from '../onboarding';
import { PromptInspector } from '../prompt-inspector';
import { Sidebar } from '../sidebar';
import { TopBar } from '../top-bar';
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
    handleRestorePrompt,
    handleSearchChange,
    handleSettingsOpen,
    handleSelectPrompt,
    handleSidebarItemSelect,
    handleSignOutSuccess,
    handleToggleTheme,
    handleToggleFavorite,
    handleUpdatePromptFolder,
    handleUpdatePromptTags,
    libraryData,
    mode,
    screen,
    searchQuery,
    syncStatus,
    theme,
    unresolvedConflictCount,
    userId,
    showInspector,
  } = controller;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleMobileSidebarItemSelect = (item: string) => {
    handleSidebarItemSelect(item);
    closeMobileNav();
  };

  const handleMobileSettingsOpen = () => {
    handleSettingsOpen();
    closeMobileNav();
  };

  const handleMobileInspectorClose = () => {
    if (libraryData.selectedPrompt) {
      handleSelectPrompt(libraryData.selectedPrompt.id);
    }
  };

  if (screen.name === 'onboarding') {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          authService={authService}
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
        mobileNavOpen={mobileNavOpen}
        onMobileNavToggle={() => setMobileNavOpen(true)}
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
          className="hidden md:flex"
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

        {mobileNavOpen && (
          <div className="fixed inset-0 z-[70] md:hidden">
            <button
              type="button"
              aria-label="Close navigation backdrop"
              className="absolute inset-0 h-full w-full cursor-default bg-black/40"
              onClick={closeMobileNav}
            />
            <div className="relative h-full w-[min(18rem,calc(100vw-2rem))] shadow-2xl">
              <Sidebar
                ariaLabel="Mobile navigation"
                variant="drawer"
                folders={libraryData.derivedFolders}
                activeItem={activeSidebarItem}
                onItemSelect={handleMobileSidebarItemSelect}
                promptCountByFolder={libraryData.promptCountByFolder}
                totalPromptCount={libraryData.sidebarFilterCounts.total}
                favoriteCount={libraryData.sidebarFilterCounts.favorites}
                recentCount={libraryData.sidebarFilterCounts.recent}
                archivedCount={libraryData.sidebarFilterCounts.archived}
                tagCounts={libraryData.sidebarTagCounts}
                onSettingsOpen={handleMobileSettingsOpen}
                onToggleTheme={handleToggleTheme}
                onCreateFolder={handleCreateFolder}
                onClose={closeMobileNav}
                theme={theme}
              />
            </div>
          </div>
        )}

        <AppScreenRouter controller={controller} />

        {showInspector && libraryData.selectedPrompt && (
          <>
            <button
              type="button"
              aria-label="Close prompt details backdrop"
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={handleMobileInspectorClose}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 h-[82dvh] max-h-[82dvh] overflow-hidden rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl md:static md:z-auto md:h-auto md:max-h-none md:w-80 md:shrink-0 md:overflow-y-auto md:rounded-none md:border-t-0 md:bg-transparent md:pt-14 md:shadow-none">
              <PromptInspector
                prompt={libraryData.selectedPrompt}
                availableTags={libraryData.availableTags}
                folder={libraryData.selectedPromptFolder}
                folders={libraryData.derivedFolders}
                variables={libraryData.selectedPromptVariables}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEditPrompt}
                onDuplicate={handleDuplicatePrompt}
                onArchive={handleArchivePrompt}
                onDelete={handleDeletePrompt}
                onRestore={handleRestorePrompt}
                onCopyBody={handleCopyPromptBody}
                onCreateFolder={handleCreateFolder}
                onUpdateFolder={handleUpdatePromptFolder}
                onUpdateTags={handleUpdatePromptTags}
                onClose={handleMobileInspectorClose}
              />
            </div>
          </>
        )}
      </div>

      <AppOverlays controller={controller} />
    </div>
  );
}
