import type { IAuthService } from '../services/interfaces';

export const AUTH_UNCONFIGURED_MESSAGE =
  'Firebase is not configured for this build. Add the Firebase environment variables and restart PromptDock.';

export function isAuthServiceAvailable(authService?: IAuthService): boolean {
  if (!authService) return false;
  return authService.isConfigured?.() ?? true;
}
