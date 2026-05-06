import { Check, ClipboardPaste, Copy, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface VariableFillActionsProps {
  copied: boolean;
  isComplete: boolean;
  isPasteAction: boolean;
  onCancel: () => void;
  onPrimaryAction: () => void;
}

export function VariableFillActions({
  copied,
  isComplete,
  isPasteAction,
  onCancel,
  onPrimaryAction,
}: VariableFillActionsProps) {
  const primaryActionLabel = isPasteAction ? 'Paste into Active App' : 'Copy to Clipboard';

  return (
    <div
      className="border-t px-4 py-3 sm:flex sm:items-center sm:justify-end sm:px-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <Button variant="ghost" size="sm" onClick={onCancel} className="w-full sm:w-auto">
          <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Cancel
          <kbd
            className="ml-1.5 hidden rounded border px-1 py-0.5 text-[10px] font-mono sm:inline"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
            }}
          >
            Esc
          </kbd>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onPrimaryAction}
          disabled={!isComplete}
          className={[
            'w-full sm:w-auto',
            !isPasteAction && copied ? 'bg-green-600 hover:bg-green-700' : '',
          ].filter(Boolean).join(' ')}
        >
          {!isPasteAction && copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Copied!
            </>
          ) : (
            <>
              {isPasteAction ? (
                <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
              {primaryActionLabel}
              <kbd
                className="ml-1.5 hidden rounded border px-1 py-0.5 text-[10px] font-mono sm:inline"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                ⌘↵
              </kbd>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
