// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openFile } from '../file-dialog';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('browser file import', () => {
  it('exposes the pending input to DOM file selection and cleans up after reading', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const pending = openFile();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    Object.defineProperty(input!, 'files', { value: [new File(['中文 😀\n{}'], 'prompts.json')] });
    input!.dispatchEvent(new Event('change'));
    await expect(pending).resolves.toBe('中文 😀\n{}');
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('cleans up cancellation so the next import can select a file', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const pending = openFile();
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    input!.dispatchEvent(new Event('cancel'));
    await expect(pending).resolves.toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
    const retry = openFile();
    document.querySelector('input[type="file"]')!.dispatchEvent(new Event('cancel'));
    await expect(retry).resolves.toBeNull();
  });
});
