import { useState } from 'react';
import { AppModeProvider } from './contexts/AppModeProvider';
import { MainLibraryScreen } from './screens/MainLibraryScreen';
import { PromptEditor } from './screens/PromptEditor';
import { SettingsScreen } from './screens/SettingsScreen';
import { VariableFillModal } from './components/VariableFillModal';
import { usePromptStore } from './stores/prompt-store';
import { VariableParser } from './services/variable-parser';

const parser = new VariableParser();

type Screen = 'library' | 'editor' | 'settings';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('library');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const prompts = usePromptStore((s) => s.prompts);

  const handleSelectPrompt = (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    const vars = parser.parse(prompt.body);
    if (vars.length > 0) {
      setSelectedPrompt(id);
    } else {
      navigator.clipboard.writeText(prompt.body);
    }
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); };
  const handlePaste = (text: string) => { navigator.clipboard.writeText(text); };

  const activePrompt = selectedPrompt ? prompts.find((p) => p.id === selectedPrompt) : null;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {screen === 'library' && (
        <MainLibraryScreen
          onEditPrompt={(id) => { setEditingPromptId(id); setScreen('editor'); }}
          onSelectPrompt={handleSelectPrompt}
          onNavigateSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'editor' && (
        <PromptEditor promptId={editingPromptId} onBack={() => setScreen('library')} />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('library')} />
      )}
      {activePrompt && (
        <VariableFillModal
          prompt={activePrompt}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppModeProvider>
      <AppContent />
    </AppModeProvider>
  );
}
