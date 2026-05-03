import { PromptSearchShortcutHints } from '../components/prompt-search';
import { VariableFillModal } from '../components/variable-fill';
import { QuickLauncherError } from './quick-launcher/QuickLauncherError';
import { QuickLauncherResults } from './quick-launcher/QuickLauncherResults';
import { QuickLauncherSearchInput } from './quick-launcher/QuickLauncherSearchInput';
import { useQuickLauncherController } from './quick-launcher/useQuickLauncherController';

export function QuickLauncherWindow() {
  const launcher = useQuickLauncherController();

  if (launcher.selectedPrompt) {
    const selectedPrompt = launcher.selectedPrompt;
    return (
      <div className="flex h-screen flex-col bg-white dark:bg-gray-800">
        <QuickLauncherError message={launcher.actionError} variant="floating" />
        <VariableFillModal
          prompt={selectedPrompt}
          variables={launcher.selectedVariables}
          defaultAction={launcher.defaultAction}
          onCopy={(renderedText) => launcher.copyAndClose(renderedText, selectedPrompt.id)}
          onPaste={(renderedText) => launcher.pasteAndClose(renderedText, selectedPrompt.id)}
          onCancel={() => launcher.setSelectedPrompt(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-gray-800">
      <QuickLauncherSearchInput
        actionError={launcher.actionError}
        query={launcher.query}
        searchInputRef={launcher.searchInputRef}
        onKeyDown={launcher.handleSearchKeyDown}
        onQueryChange={launcher.setQuery}
      />

      <QuickLauncherResults
        highlightIndex={launcher.highlightIndex}
        isLoading={launcher.isLoading}
        prompts={launcher.prompts}
        query={launcher.query}
        results={launcher.results}
        onHighlightPrompt={launcher.setHighlightIndex}
        onSelectPrompt={launcher.handleSelectPrompt}
      />

      <PromptSearchShortcutHints variant="launcher" />
    </div>
  );
}
