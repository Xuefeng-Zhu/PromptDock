// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property 1: Clipboard fallback preserves text
 *
 * For any non-empty string, when the Tauri copy_to_clipboard command fails
 * (rejects), the copyToClipboard utility function SHALL call
 * navigator.clipboard.writeText with the exact same string, ensuring no text
 * is lost or modified during fallback.
 *
 * **Validates: Requirements 3.4**
 */

// Use vi.hoisted so the mock fn is available when vi.mock factory runs (hoisted)
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(() => Promise.reject(new Error('Tauri not available'))),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { copyToClipboard } from '../../utils/clipboard';

describe('Clipboard fallback preserves text (Property 1)', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset invoke mock to always reject
    mockInvoke.mockReset();
    mockInvoke.mockImplementation(() =>
      Promise.reject(new Error('Tauri not available')),
    );

    // Mock navigator.clipboard.writeText
    writeTextMock = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  it('for any non-empty string, when Tauri invoke fails, navigator.clipboard.writeText is called with the exact same string', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (text) => {
          writeTextMock.mockClear();
          mockInvoke.mockClear();
          mockInvoke.mockImplementation(() =>
            Promise.reject(new Error('Tauri not available')),
          );

          await copyToClipboard(text);

          // navigator.clipboard.writeText must have been called exactly once
          expect(writeTextMock).toHaveBeenCalledTimes(1);
          // with the exact same string — no text lost or modified
          expect(writeTextMock).toHaveBeenCalledWith(text);
        },
      ),
      { numRuns: 100 },
    );
  });
});
