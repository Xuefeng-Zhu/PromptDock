import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { X } from 'lucide-react';
import { parsePromptJson, type PromptJsonDraft } from '../../services/prompt-json';
import type { Folder } from '../../types/index';
import { Button, Textarea } from '../ui';

interface PromptJsonImportModalProps {
  folders: Folder[];
  onCancel: () => void;
  onApply: (data: PromptJsonDraft) => void | Promise<void>;
}

const JSON_PLACEHOLDER = `{
  "title": "Release notes",
  "body": "Summarize these changes for {{audience}}.",
  "tags": ["writing"],
  "favorite": true
}`;

export function PromptJsonImportModal({
  folders,
  onCancel,
  onApply,
}: PromptJsonImportModalProps) {
  const [json, setJson] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = parsePromptJson(json, { folders });
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    setIsApplying(true);
    try {
      await onApply(result.data);
    } catch (err) {
      setErrors([
        `Failed to fill form: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setIsApplying(false);
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] animate-[fadeIn_150ms_ease-out]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleBackdropClick}
      data-testid="prompt-json-import-backdrop"
    >
      <dialog
        open
        role="dialog"
        aria-modal="true"
        aria-label="Fill prompt form from JSON"
        className="relative m-0 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-2xl animate-[slideDown_150ms_ease-out]"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text-main)]">
            Fill From JSON
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--color-text-main)]"
            aria-label="Close JSON prompt dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-4">
            <Textarea
              ref={textareaRef}
              label="Prompt JSON"
              value={json}
              onChange={(event) => {
                setJson(event.target.value);
                if (errors.length > 0) setErrors([]);
              }}
              placeholder={JSON_PLACEHOLDER}
              rows={12}
              spellCheck={false}
              className="font-mono"
            />

            {errors.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <ul className="space-y-1">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isApplying}>
              {isApplying ? 'Filling...' : 'Fill Form'}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
