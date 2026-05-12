import { useCallback, useEffect, useState } from 'react';
import { trackScreenView } from '../../services/analytics-service';
import type { ToastStore } from '../../stores/toast-store';
import type { PromptRecipe } from '../../types/index';
import { isOnboardingComplete } from '../../utils/onboarding';
import {
  createDefaultPromptFilters,
  type FilterType,
} from '../../utils/prompt-filters';
import type { Screen } from '../../components/app-shell/types';
import type { SettingsSectionId } from '../../components/settings/settings-data';

interface UseShellNavigationOptions {
  addToast: ToastStore['addToast'];
}

interface UseSelectedPromptVisibilityOptions {
  filteredPrompts: PromptRecipe[];
  screen: Screen;
  selectedPromptId: string | null;
  setSelectedPromptId: (id: string | null) => void;
}

function isRootLibraryItem(item: string): boolean {
  return item === 'library' || item === 'favorites' || item === 'recent' || item === 'archived';
}

/**
 * Owns top-level app navigation state and route-like screen transitions.
 * Also guards editor exits with unsaved changes and tracks screen-view analytics.
 */
export function useShellNavigation({ addToast }: UseShellNavigationOptions) {
  const [screen, setScreen] = useState<Screen>(() => ({
    name: isOnboardingComplete() ? 'library' : 'onboarding',
  }));
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [variableFillPromptId, setVariableFillPromptId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => createDefaultPromptFilters());
  const [activeSidebarItem, setActiveSidebarItem] = useState('library');
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState(false);

  useEffect(() => {
    trackScreenView(screen.name);
  }, [screen.name]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const blockIfEditorHasUnsavedChanges = useCallback(() => {
    if (screen.name !== 'editor' || !editorHasUnsavedChanges) return false;

    addToast('Save or cancel your prompt changes before leaving the editor.', 'info');
    return true;
  }, [addToast, editorHasUnsavedChanges, screen.name]);

  const handleCommandPaletteOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleSidebarItemSelect = useCallback(
    (item: string) => {
      if (blockIfEditorHasUnsavedChanges()) return;

      setActiveSidebarItem(item);
      setScreen({ name: 'library' });
      if (isRootLibraryItem(item)) {
        setActiveFilter(createDefaultPromptFilters());
      }
    },
    [blockIfEditorHasUnsavedChanges],
  );

  const handleFolderDeleted = useCallback(
    (folderId: string) => {
      if (activeSidebarItem !== folderId) return;

      setActiveSidebarItem('library');
      setActiveFilter(createDefaultPromptFilters());
    },
    [activeSidebarItem],
  );

  const handleOnboardingComplete = useCallback((_choice: 'local' | 'signin') => {
    setScreen({ name: 'library' });
  }, []);

  const handleSelectPrompt = useCallback((id: string) => {
    setSelectedPromptId((currentId) => (currentId === id ? null : id));
  }, []);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const handleNewPrompt = useCallback(() => {
    setScreen({ name: 'editor' });
  }, []);

  const handleEditorCancel = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  const handleSettingsBack = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  const openSettings = useCallback((section?: SettingsSectionId) => {
    if (blockIfEditorHasUnsavedChanges()) return;
    setScreen({ name: 'settings', section });
  }, [blockIfEditorHasUnsavedChanges]);

  const handleSettingsOpen = useCallback(() => {
    openSettings();
  }, [openSettings]);

  const handleWorkspaceSettingsOpen = useCallback(() => {
    openSettings('workspaces-sharing');
  }, [openSettings]);

  const handleConflictBadgeClick = useCallback(() => {
    if (blockIfEditorHasUnsavedChanges()) return;
    setScreen({ name: 'conflicts' });
  }, [blockIfEditorHasUnsavedChanges]);

  const handleConflictBack = useCallback(() => {
    setScreen({ name: 'library' });
  }, []);

  return {
    activeFilter,
    activeSidebarItem,
    blockIfEditorHasUnsavedChanges,
    commandPaletteOpen,
    editorHasUnsavedChanges,
    handleCommandPaletteOpen,
    handleConflictBack,
    handleConflictBadgeClick,
    handleEditorCancel,
    handleFilterChange,
    handleFolderDeleted,
    handleNewPrompt,
    handleOnboardingComplete,
    handleSelectPrompt,
    handleSettingsBack,
    handleSettingsOpen,
    handleWorkspaceSettingsOpen,
    handleSidebarItemSelect,
    screen,
    selectedPromptId,
    setCommandPaletteOpen,
    setEditorHasUnsavedChanges,
    setScreen,
    setSelectedPromptId,
    setVariableFillPromptId,
    variableFillPromptId,
  };
}

/**
 * Clears the selected prompt when filters or navigation hide it from the library.
 * This prevents inspector panels from showing data that is no longer in view.
 */
export function useSelectedPromptVisibility({
  filteredPrompts,
  screen,
  selectedPromptId,
  setSelectedPromptId,
}: UseSelectedPromptVisibilityOptions) {
  useEffect(() => {
    if (screen.name !== 'library' || selectedPromptId === null) return;
    if (!filteredPrompts.some((prompt) => prompt.id === selectedPromptId)) {
      setSelectedPromptId(null);
    }
  }, [filteredPrompts, screen.name, selectedPromptId, setSelectedPromptId]);
}
