import type { AuthError } from '../types/index';

export function authErrorMessage(error: AuthError): string {
  switch (error) {
    case 'invalid-credentials':
      return 'Invalid email or password. Please try again.';
    case 'email-in-use':
      return 'An account with this email already exists.';
    case 'weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'missing-configuration':
      return 'Firebase is not configured for this build. Add the Firebase environment variables and restart PromptDock.';
    case 'network':
      return 'Network error while contacting Firebase. Check your connection and try again.';
    case 'popup-blocked':
      return 'The Google sign-in popup was blocked. Allow popups for PromptDock and try again.';
    case 'popup-cancelled':
      return 'Google sign-in was cancelled.';
    case 'unknown':
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
