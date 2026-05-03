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
  return (
    <div
      className="flex items-center justify-end border-t px-5 py-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Cancel
          <kbd
            className="ml-1.5 rounded border px-1 py-0.5 text-[10px] font-mono"
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
          className={!isPasteAction && copied ? 'bg-green-600 hover:bg-green-700' : ''}
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
              {isPasteAction ? 'Paste into active app' : 'Copy final prompt'}
              <kbd
                className="ml-1.5 rounded border px-1 py-0.5 text-[10px] font-mono"
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
