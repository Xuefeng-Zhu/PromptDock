import { useCallback, useState } from 'react';
import { ImportExportService } from '../services/import-export';
import { useAppModeStore } from '../stores/app-mode-store';
import { usePromptStore, type CreatePromptData } from '../stores/prompt-store';
import { openFile, saveFile } from '../utils/file-dialog';
import type { DuplicateInfo, PromptRecipe } from '../types/index';

const importExportService = new ImportExportService();

function formatImportError(prefix: string, err: unknown): string {
  return `${prefix}: ${err instanceof Error ? err.message : String(err)}`;
}

/**
 * Converts parsed import records into create payloads for the active storage mode.
 * Imported ids and timestamps are intentionally discarded because repositories
 * own identity and modification metadata for newly inserted prompts.
 */
function toImportedPromptData(
  prompt: PromptRecipe,
  workspaceId: string,
  createdBy: string,
): CreatePromptData {
  return {
    workspaceId,
    title: prompt.title,
    description: prompt.description,
    body: prompt.body,
    variables: prompt.variables,
    tags: prompt.tags,
    folderId: prompt.folderId,
    favorite: prompt.favorite,
    archived: prompt.archived,
    archivedAt: prompt.archivedAt,
    lastUsedAt: prompt.lastUsedAt,
    createdBy,
    version: prompt.version,
  };
}

/**
 * Owns the import/export workflow for settings screens.
 * Tracks validation errors, duplicate-resolution state, save/open dialog side
 * effects, and whether imported prompts should be written locally or to sync.
 */
export function usePromptImportExport() {
  const prompts = usePromptStore((s) => s.prompts);
  const activeWorkspaceId = usePromptStore((s) => s.activeWorkspaceId);
  const createPrompt = usePromptStore((s) => s.createPrompt);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [pendingNonDuplicates, setPendingNonDuplicates] = useState<PromptRecipe[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setImportErrors([]);
    setSuccessMessage(null);
  }, []);

  const targetWorkspaceId = mode !== 'local' && userId ? activeWorkspaceId : 'local';
  const targetCreatedBy = mode !== 'local' && userId ? userId : 'local';

  /**
   * Inserts already-validated prompts into the current workspace one by one.
   * Sequential writes keep repository side effects and error reporting predictable.
   */
  const importPrompts = useCallback(
    async (incomingPrompts: PromptRecipe[]) => {
      for (const prompt of incomingPrompts) {
        await createPrompt(toImportedPromptData(prompt, targetWorkspaceId, targetCreatedBy));
      }
    },
    [createPrompt, targetCreatedBy, targetWorkspaceId],
  );

  const handleExport = useCallback(async () => {
    clearMessages();
    setIsExporting(true);
    try {
      const json = importExportService.exportToJSON(prompts);
      const timestamp = new Date().toISOString().slice(0, 10);
      const saved = await saveFile(json, `promptdock-export-${timestamp}.json`);
      if (saved) {
        setSuccessMessage('Prompts exported successfully.');
      }
    } catch (err) {
      setImportErrors([formatImportError('Export failed', err)]);
    } finally {
      setIsExporting(false);
    }
  }, [clearMessages, prompts]);

  const handleImport = useCallback(async () => {
    clearMessages();
    setDuplicates([]);
    setPendingNonDuplicates([]);
    setIsImporting(true);
    try {
      const content = await openFile();
      if (!content) {
        return;
      }

      const result = importExportService.importFromJSON(content);
      if (!result.success) {
        setImportErrors(result.errors);
        return;
      }

      const nextDuplicates = importExportService.detectDuplicates(result.prompts, prompts);
      const duplicateIncomingIds = new Set(nextDuplicates.map((dupe) => dupe.incoming.id));
      const nonDuplicates = result.prompts.filter((prompt) => !duplicateIncomingIds.has(prompt.id));

      // Pause the import when duplicates exist so the user can choose whether
      // to skip or overwrite before any incoming prompt is persisted.
      if (nextDuplicates.length > 0) {
        setDuplicates(nextDuplicates);
        setPendingNonDuplicates(nonDuplicates);
        return;
      }

      await importPrompts(result.prompts);
      setSuccessMessage(`Imported ${result.prompts.length} prompt(s) successfully.`);
    } catch (err) {
      setImportErrors([formatImportError('Import failed', err)]);
    } finally {
      setIsImporting(false);
    }
  }, [clearMessages, importPrompts, prompts]);

  const handleSkipAll = useCallback(async () => {
    try {
      await importPrompts(pendingNonDuplicates);
      const count = pendingNonDuplicates.length;
      setDuplicates([]);
      setPendingNonDuplicates([]);
      setSuccessMessage(
        count > 0
          ? `Imported ${count} prompt(s), skipped ${duplicates.length} duplicate(s).`
          : `Skipped ${duplicates.length} duplicate(s). No new prompts imported.`,
      );
    } catch (err) {
      setImportErrors([formatImportError('Import failed', err)]);
    }
  }, [duplicates.length, importPrompts, pendingNonDuplicates]);

  const handleOverwriteAll = useCallback(async () => {
    try {
      for (const dupe of duplicates) {
        const changes: Partial<PromptRecipe> = {
          title: dupe.incoming.title,
          description: dupe.incoming.description,
          body: dupe.incoming.body,
          tags: dupe.incoming.tags,
          folderId: dupe.incoming.folderId,
          favorite: dupe.incoming.favorite,
        };
        if (dupe.incoming.variables !== undefined) {
          changes.variables = dupe.incoming.variables;
        }
        await updatePrompt(dupe.existing.id, changes);
      }
      await importPrompts(pendingNonDuplicates);
      const total = duplicates.length + pendingNonDuplicates.length;
      setDuplicates([]);
      setPendingNonDuplicates([]);
      setSuccessMessage(`Imported ${total} prompt(s), overwrote ${duplicates.length} duplicate(s).`);
    } catch (err) {
      setImportErrors([formatImportError('Import failed', err)]);
    }
  }, [duplicates, importPrompts, pendingNonDuplicates, updatePrompt]);

  return {
    duplicates,
    importErrors,
    isExporting,
    isImporting,
    successMessage,
    handleExport,
    handleImport,
    handleOverwriteAll,
    handleSkipAll,
  };
}
