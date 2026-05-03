import { Download, Upload } from 'lucide-react';
import { usePromptImportExport } from '../../../hooks/use-prompt-import-export';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ImportExportMessages } from './ImportExportMessages';
import { SettingsCardTitle } from './SettingsCardTitle';

export function ImportExportSettingsCard() {
  const {
    duplicates,
    importErrors,
    isExporting,
    isImporting,
    successMessage,
    handleExport,
    handleImport,
    handleOverwriteAll,
    handleSkipAll,
  } = usePromptImportExport();

  return (
    <Card padding="lg">
      <SettingsCardTitle>Import / Export</SettingsCardTitle>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        Back up your prompt library or import prompts from a JSON file.
      </p>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Export prompts to JSON file"
        >
          <Upload size={16} className="mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleImport}
          disabled={isImporting}
          aria-label="Import prompts from JSON file"
        >
          <Download size={16} className="mr-2" />
          {isImporting ? 'Importing...' : 'Import'}
        </Button>
      </div>

      <ImportExportMessages
        duplicates={duplicates}
        importErrors={importErrors}
        successMessage={successMessage}
        onOverwriteAll={handleOverwriteAll}
        onSkipAll={handleSkipAll}
      />
    </Card>
  );
}
