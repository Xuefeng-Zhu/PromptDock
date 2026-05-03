export interface HotkeyKeyboardEventLike {
  altKey: boolean;
  code: string;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
}

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

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}

export function splitHotkey(value: string): string[] {
  return value
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function displayHotkeyToken(token: string, isMac: boolean): string {
  const mapped = DISPLAY_TOKENS[token];
  if (mapped) return isMac ? mapped.mac : mapped.other;
  if (/^Key[A-Z]$/.test(token)) return token.slice(3);
  if (/^Digit[0-9]$/.test(token)) return token.slice(5);
  return token;
}

export function eventModifiers(event: HotkeyKeyboardEventLike): string[] {
  const parts: string[] = [];
  if (event.metaKey || event.key === 'Meta') parts.push('CommandOrControl');
  if (event.ctrlKey || event.key === 'Control') parts.push('Control');
  if (event.altKey || event.key === 'Alt') parts.push('Alt');
  if (event.shiftKey || event.key === 'Shift') parts.push('Shift');
  return parts;
}

export function eventPrimaryKey(event: HotkeyKeyboardEventLike): string | null {
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

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}
