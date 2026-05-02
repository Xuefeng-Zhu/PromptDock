import React, { useCallback, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'recording' | 'saving' | 'saved';

type HotkeyChangeHandler = (hotkey: string) => boolean | Promise<boolean>;

export interface HotkeyRecorderProps {
  value: string;
  onChange: HotkeyChangeHandler;
  error?: string | null;
  ariaLabel: string;
  disabled?: boolean;
}

// ─── Hotkey parsing and display ───────────────────────────────────────────────

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'AltGraph', 'Shift', 'OS']);

const KEY_FROM_CODE: Record<string, string> = {
  Backquote: 'Backquote',
  Backslash: 'Backslash',
  BracketLeft: 'BracketLeft',
  BracketRight: 'BracketRight',
  Comma: 'Comma',
  Equal: 'Equal',
  Minus: 'Minus',
  Period: 'Period',
  Quote: 'Quote',
  Semicolon: 'Semicolon',
  Slash: 'Slash',
  Backspace: 'Backspace',
  Delete: 'Delete',
  End: 'End',
  Enter: 'Enter',
  Escape: 'Escape',
  Home: 'Home',
  Insert: 'Insert',
  PageDown: 'PageDown',
  PageUp: 'PageUp',
  Space: 'Space',
  Tab: 'Tab',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  Numpad0: 'Numpad0',
  Numpad1: 'Numpad1',
  Numpad2: 'Numpad2',
  Numpad3: 'Numpad3',
  Numpad4: 'Numpad4',
  Numpad5: 'Numpad5',
  Numpad6: 'Numpad6',
  Numpad7: 'Numpad7',
  Numpad8: 'Numpad8',
  Numpad9: 'Numpad9',
  NumpadAdd: 'NumpadAdd',
  NumpadDecimal: 'NumpadDecimal',
  NumpadDivide: 'NumpadDivide',
  NumpadEnter: 'NumpadEnter',
  NumpadEqual: 'NumpadEqual',
  NumpadMultiply: 'NumpadMultiply',
  NumpadSubtract: 'NumpadSubtract',
};

const KEY_FROM_KEY: Record<string, string> = {
  ' ': 'Space',
  Spacebar: 'Space',
  Esc: 'Escape',
  Escape: 'Escape',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Enter: 'Enter',
  Tab: 'Tab',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  PageDown: 'PageDown',
  PageUp: 'PageUp',
  Home: 'Home',
  End: 'End',
  Insert: 'Insert',
  '=': 'Equal',
  '-': 'Minus',
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '`': 'Backquote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
};

const DISPLAY_TOKENS: Record<string, { mac: string; other: string }> = {
  CommandOrControl: { mac: '⌘', other: 'Ctrl' },
  CmdOrControl: { mac: '⌘', other: 'Ctrl' },
  Command: { mac: '⌘', other: 'Cmd' },
  Cmd: { mac: '⌘', other: 'Cmd' },
  Meta: { mac: '⌘', other: 'Meta' },
  Super: { mac: '⌘', other: 'Win' },
  Control: { mac: '⌃', other: 'Ctrl' },
  Ctrl: { mac: '⌃', other: 'Ctrl' },
  Alt: { mac: '⌥', other: 'Alt' },
  Option: { mac: '⌥', other: 'Alt' },
  Shift: { mac: '⇧', other: 'Shift' },
  Space: { mac: 'Space', other: 'Space' },
  Enter: { mac: '↵', other: 'Enter' },
  Escape: { mac: 'Esc', other: 'Esc' },
  Tab: { mac: 'Tab', other: 'Tab' },
  Backspace: { mac: '⌫', other: 'Backspace' },
  Delete: { mac: 'Del', other: 'Del' },
  ArrowUp: { mac: '↑', other: '↑' },
  ArrowDown: { mac: '↓', other: '↓' },
  ArrowLeft: { mac: '←', other: '←' },
  ArrowRight: { mac: '→', other: '→' },
  Equal: { mac: '=', other: '=' },
  Minus: { mac: '-', other: '-' },
  Comma: { mac: ',', other: ',' },
  Period: { mac: '.', other: '.' },
  Slash: { mac: '/', other: '/' },
  Semicolon: { mac: ';', other: ';' },
  Quote: { mac: "'", other: "'" },
  Backquote: { mac: '`', other: '`' },
  BracketLeft: { mac: '[', other: '[' },
  BracketRight: { mac: ']', other: ']' },
  Backslash: { mac: '\\', other: '\\' },
};

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}

function splitHotkey(value: string): string[] {
  return value
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
}

function displayToken(token: string, isMac: boolean): string {
  const mapped = DISPLAY_TOKENS[token];
  if (mapped) return isMac ? mapped.mac : mapped.other;
  if (/^Key[A-Z]$/.test(token)) return token.slice(3);
  if (/^Digit[0-9]$/.test(token)) return token.slice(5);
  return token;
}

function eventModifiers(event: React.KeyboardEvent<HTMLElement>): string[] {
  const parts: string[] = [];
  if (event.metaKey || event.key === 'Meta') parts.push('CommandOrControl');
  if (event.ctrlKey || event.key === 'Control') parts.push('Control');
  if (event.altKey || event.key === 'Alt') parts.push('Alt');
  if (event.shiftKey || event.key === 'Shift') parts.push('Shift');
  return parts;
}

function eventPrimaryKey(event: React.KeyboardEvent<HTMLElement>): string | null {
  const { code, key } = event;

  if (code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
    if (KEY_FROM_CODE[code]) return KEY_FROM_CODE[code];
  }

  if (/^[a-z]$/i.test(key)) return key.toUpperCase();
  if (/^[0-9]$/.test(key)) return key;
  if (/^F(?:[1-9]|1[0-9]|2[0-4])$/i.test(key)) return key.toUpperCase();
  return KEY_FROM_KEY[key] ?? null;
}

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
          {displayToken(part, isMac)}
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

  const handleRecorderKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isRecording) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startRecording();
        }
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
      if (MODIFIER_KEYS.has(event.key)) {
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
    [cancelRecording, isRecording, persistHotkey, startRecording],
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label={ariaLabel}
          data-hotkey-value={value}
          onClick={startRecording}
          onKeyDown={handleRecorderKeyDown}
          onBlur={() => {
            if (isRecording) cancelRecording();
          }}
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
