import { Download, Upload } from 'lucide-react';
import { usePromptImportExport } from '../../../hooks/use-prompt-import-export';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { FileInput } from '../../ui/FileInput';
import { ImportExportMessages } from './ImportExportMessages';
import { SettingsCardTitle } from './SettingsCardTitle';

export function ImportExportSettingsCard() {
  const {
    canImport,
    duplicateResolutionAction,
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
          onClick={() => void handleImport()}
          disabled={isImporting || duplicateResolutionAction !== null || !canImport}
          aria-label="Import prompts from JSON file"
          title={!canImport ? 'Viewers cannot import prompts into this workspace.' : undefined}
        >
          <Download size={16} className="mr-2" />
          {isImporting ? 'Importing...' : 'Import'}
        </Button>
      </div>

      <div className="mt-4 max-w-md">
        <FileInput
          label="Choose JSON file"
          accept=".json,application/json"
          disabled={isImporting || duplicateResolutionAction !== null || !canImport}
          hint="Select a JSON backup to import. You can review duplicates before changing existing prompts."
          onFileSelect={(file) => void handleImport(file)}
        />
      </div>

      <ImportExportMessages
        duplicates={duplicates}
        duplicateResolutionAction={duplicateResolutionAction}
        importErrors={importErrors}
        successMessage={successMessage}
        onOverwriteAll={handleOverwriteAll}
        onSkipAll={handleSkipAll}
      />
    </Card>
  );
}
