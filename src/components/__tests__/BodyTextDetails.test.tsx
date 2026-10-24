// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BodyTextDetails } from '../prompt-editor/BodyTextDetails';
import { fingerprintText, type TextFingerprint } from '../../utils/text-fingerprint';

vi.mock('../../utils/text-fingerprint', () => ({ fingerprintText: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('only calculates when opened and never displays an older draft fingerprint while an edit is pending', async () => {
  let finishOld!: (value: TextFingerprint) => void;
  let finishNew!: (value: TextFingerprint) => void;
  vi.mocked(fingerprintText).mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
    .mockImplementationOnce(() => new Promise((resolve) => { finishNew = resolve; }));
  const { rerender } = render(<BodyTextDetails body="first" />);
  expect(fingerprintText).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Text details' }));
  rerender(<BodyTextDetails body="second" />);
  await act(async () => finishNew({ utf8Bytes: 6, sha256: 'second-hash' }));
  expect(screen.getByLabelText('Text SHA-256').textContent).toBe('second-hash');
  await act(async () => finishOld({ utf8Bytes: 5, sha256: 'first-hash' }));
  expect(screen.getByLabelText('Text SHA-256').textContent).toBe('second-hash');
  vi.mocked(fingerprintText).mockImplementationOnce(() => new Promise(() => {}));
  rerender(<BodyTextDetails body="third" />);
  expect(screen.queryByLabelText('Text SHA-256')).toBeNull();
  expect(screen.getByText('Calculating text fingerprint…')).toBeTruthy();
});

it('reports unavailable crypto without showing a hash or claiming equality', async () => {
  vi.mocked(fingerprintText).mockRejectedValue(new Error('Unavailable'));
  render(<BodyTextDetails body="any text" />);
  fireEvent.click(screen.getByRole('button', { name: 'Text details' }));
  expect((await screen.findByRole('alert')).textContent).toContain('No comparison has been made');
  expect(screen.queryByLabelText('Text SHA-256')).toBeNull();
});
