import { AlertCircle } from 'lucide-react';
import type { DuplicateInfo } from '../../../types/index';
import { Button } from '../../ui/Button';

interface ImportExportMessagesProps {
  duplicates: DuplicateInfo[];
  importErrors: string[];
  successMessage: string | null;
  onOverwriteAll: () => void | Promise<void>;
  onSkipAll: () => void | Promise<void>;
}

export function ImportExportMessages({
  duplicates,
  importErrors,
  successMessage,
  onOverwriteAll,
  onSkipAll,
}: ImportExportMessagesProps) {
  return (
    <>
      {successMessage && (
        <p role="status" className="mt-3 text-xs text-green-600">
          {successMessage}
        </p>
      )}

      {importErrors.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-xs font-medium text-red-700">Import failed</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {importErrors.map((err) => (
              <li key={err} className="text-xs text-red-600">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <div role="alert" className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {duplicates.length} duplicate(s) found
            </span>
          </div>
          <ul className="mb-3 list-inside list-disc space-y-0.5">
            {duplicates.map((duplicate) => (
              <li key={`${duplicate.incoming.id}-${duplicate.existing.id}-${duplicate.matchedOn}`} className="text-xs text-amber-700">
                &quot;{duplicate.incoming.title}&quot; &mdash; matched on {duplicate.matchedOn}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSkipAll}
              aria-label="Skip duplicates"
            >
              Skip Duplicates
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOverwriteAll}
              aria-label="Overwrite duplicates"
            >
              Overwrite Duplicates
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
