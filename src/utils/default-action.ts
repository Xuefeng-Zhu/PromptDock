import type { UserSettings } from '../types/index';
import { isTauriRuntime } from './runtime';

export function canPasteToActiveApp(): boolean {
  return isTauriRuntime();
}

export function resolveDefaultAction(
  defaultAction: UserSettings['defaultAction'],
  canPaste = canPasteToActiveApp(),
): UserSettings['defaultAction'] {
  return defaultAction === 'paste' && !canPaste ? 'copy' : defaultAction;
}
