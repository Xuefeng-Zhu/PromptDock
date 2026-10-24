// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BodyFileImport } from '../prompt-editor/BodyFileImport';

afterEach(cleanup);

it('loads exact text into the draft and preserves it when a later file cannot be read', async () => {
  const onBodyChange = vi.fn();
  render(<BodyFileImport onBodyChange={onBodyChange} />);
  const input = screen.getByLabelText('Load text file');
  const file = new File([], 'exact.txt');
  Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue('  中文 😀\n{{bad-name!}}\n') });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(onBodyChange).toHaveBeenCalledWith('  中文 😀\n{{bad-name!}}\n'));
  const failed = new File([], 'unreadable.txt');
  Object.defineProperty(failed, 'text', { value: vi.fn().mockRejectedValue(new Error('Read failed')) });
  fireEvent.change(input, { target: { files: [failed] } });
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Your draft body has not changed'));
  expect(onBodyChange).toHaveBeenCalledTimes(1);
  expect(input.hasAttribute('disabled')).toBe(false);
});
