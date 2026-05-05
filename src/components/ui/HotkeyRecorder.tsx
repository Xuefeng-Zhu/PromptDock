import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  displayHotkeyToken,
  eventModifiers,
  eventPrimaryKey,
  type HotkeyKeyboardEventLike,
  isMacPlatform,
  isModifierKey,
  splitHotkey,
} from '../../utils/hotkey-recorder';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'recording' | 'saving' | 'saved';

type HotkeyChangeHandler = (hotkey: string) => boolean | Promise<boolean>;
type RecordingKeyEvent = HotkeyKeyboardEventLike & {
  preventDefault: () => void;
  stopPropagation: () => void;
};

export interface HotkeyRecorderProps {
  value: string;
  onChange: HotkeyChangeHandler;
  error?: string | null;
  ariaLabel: string;
  disabled?: boolean;
}

// ─── Hotkey parsing and display ───────────────────────────────────────────────

function HotkeyKeycaps({ value }: { value: string }) {
  const isMac = useMemo(() => isMacPlatform(), []);
  const parts = splitHotkey(value);

  if (parts.length === 0) {
    return <span className="text-[var(--color-text-muted)]">Not set</span>;
  }

  return (
    <span className="flex min-w-0 flex-wrap items-center justify-center gap-1.5">
      {parts.map((part, index) => (
        <kbd
          key={`${part}-${index}`}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 font-sans text-sm font-semibold leading-none text-[var(--color-text-main)] shadow-sm"
        >
          {displayHotkeyToken(part, isMac)}
        </kbd>
      ))}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HotkeyRecorder({
  value,
  onChange,
  error,
  ariaLabel,
  disabled = false,
}: HotkeyRecorderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [previewHotkey, setPreviewHotkey] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const displayValue = isRecording ? previewHotkey : value;
  const message = error ?? validationError;

  const persistHotkey = useCallback(
    async (hotkey: string): Promise<boolean> => {
      setSaveState('saving');
      setValidationError(null);

      const saved = await onChange(hotkey);
      if (saved === false) {
        setSaveState('recording');
        return false;
      }

      setSaveState('saved');
      setIsRecording(false);
      setPreviewHotkey('');
      return true;
    },
    [onChange],
  );

  const startRecording = useCallback(() => {
    if (disabled || saveState === 'saving') return;
    setIsRecording(true);
    setPreviewHotkey('');
    setValidationError(null);
    setSaveState('recording');
  }, [disabled, saveState]);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setPreviewHotkey('');
    setValidationError(null);
    setSaveState('idle');
  }, []);

  const handleRecordingKeyDown = useCallback(
    (event: RecordingKeyEvent) => {
      if (event.key === 'Tab' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        cancelRecording();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        cancelRecording();
        return;
      }

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        void persistHotkey('');
        return;
      }

      const modifiers = eventModifiers(event);
      if (isModifierKey(event.key)) {
        setPreviewHotkey(modifiers.join('+'));
        setValidationError(null);
        return;
      }

      const primaryKey = eventPrimaryKey(event);
      if (!primaryKey) {
        setValidationError('That key is not supported for global hotkeys.');
        return;
      }

      if (modifiers.length === 0) {
        setPreviewHotkey(primaryKey);
        setValidationError('Use a modifier plus another key.');
        return;
      }

      const combo = [...modifiers, primaryKey].join('+');
      setPreviewHotkey(combo);
      void persistHotkey(combo);
    },
    [cancelRecording, persistHotkey],
  );

  useEffect(() => {
    if (!isRecording) return;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      handleRecordingKeyDown(event);
    };
    const cancelIfOutsideRecorder = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        cancelRecording();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown, true);
    document.addEventListener('pointerdown', cancelIfOutsideRecorder, true);
    document.addEventListener('focusin', cancelIfOutsideRecorder, true);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown, true);
      document.removeEventListener('pointerdown', cancelIfOutsideRecorder, true);
      document.removeEventListener('focusin', cancelIfOutsideRecorder, true);
    };
  }, [cancelRecording, handleRecordingKeyDown, isRecording]);

  const handleRecorderKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isRecording) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startRecording();
        }
        return;
      }

      handleRecordingKeyDown(event);
    },
    [handleRecordingKeyDown, isRecording, startRecording],
  );

  const handleClear = useCallback(() => {
    if (disabled || saveState === 'saving') return;
    setIsRecording(false);
    setPreviewHotkey('');
    void persistHotkey('');
  }, [disabled, persistHotkey, saveState]);

  const statusText =
    saveState === 'saving'
      ? 'Saving...'
      : saveState === 'saved'
        ? 'Saved'
        : isRecording
          ? 'Recording'
          : value
            ? 'Active'
            : 'Disabled';

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label={ariaLabel}
          data-hotkey-value={value}
          onClick={startRecording}
          onKeyDown={handleRecorderKeyDown}
          disabled={disabled || saveState === 'saving'}
          className={[
            'min-h-12 min-w-64 rounded-lg border px-3 py-2 transition-colors',
            'bg-[var(--color-panel)] text-[var(--color-text-main)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
            'disabled:pointer-events-none disabled:opacity-50',
            message
              ? 'border-red-400'
              : isRecording
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                : 'border-[var(--color-border)] hover:bg-gray-50',
          ].join(' ')}
        >
          {isRecording && !displayValue ? (
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              Recording...
            </span>
          ) : (
            <HotkeyKeycaps value={displayValue} />
          )}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled || saveState === 'saving' || (!value && !isRecording)}
          aria-label="Clear hotkey"
        >
          <X size={16} className="mr-1.5" />
          Clear
        </Button>

        <span
          role={saveState === 'saving' || saveState === 'saved' ? 'status' : undefined}
          className={[
            'text-xs font-medium',
            saveState === 'saved'
              ? 'text-green-600'
              : 'text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          {statusText}
        </span>
      </div>

      {message && (
        <p role="alert" className="text-xs text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
