import { describe, expect, it } from 'vitest';
import { formatErrorMessage, formatPrefixedErrorMessage } from '../error-message';

describe('error message formatting', () => {
  it('uses Error.message for Error instances', () => {
    expect(formatErrorMessage(new Error('Failed to sync.'))).toBe('Failed to sync.');
  });

  it('falls back to String for non-Error throws', () => {
    expect(formatErrorMessage('network unavailable')).toBe('network unavailable');
    expect(formatErrorMessage(404)).toBe('404');
  });

  it('adds a stable prefix for user-facing errors', () => {
    expect(formatPrefixedErrorMessage('Failed to import', 'bad file')).toBe(
      'Failed to import: bad file',
    );
  });
});
