import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { fingerprintText } from '../text-fingerprint';

it.each(['', 'abc', '  中文 😀\n{{bad-name!}}\n', 'Line\r\nTwo\r\n', '$& <tag> {{topic}}'])('matches an independent UTF-8 digest for %j', async (text) => {
  expect(await fingerprintText(text)).toEqual({
    utf8Bytes: Buffer.byteLength(text, 'utf8'),
    sha256: createHash('sha256').update(text, 'utf8').digest('hex'),
  });
});

it('distinguishes a missing final newline, a changed character and normalized line endings', async () => {
  const values = await Promise.all(['中文 😀\r\n', '中文 😀\n', '中文 😀', '中文 😁\r\n'].map(fingerprintText));
  expect(new Set(values.map((value) => value.sha256)).size).toBe(4);
});

it('hashes the complete large fixture and its deliberate edit, detecting a middle-character change', async () => {
  const source = await readFile('docs/hackathon/fixtures/ts4-exact-12k.txt', 'utf8');
  const original = await fingerprintText(source);
  expect(original).toEqual({ utf8Bytes: 12288, sha256: '23e14e2b4353242e11ada37a7f645db7d74437b015efdf598179cb0ce70cff7a' });
  const edited = source + '\nTS4 edited marker';
  expect((await fingerprintText(edited)).sha256).toBe(createHash('sha256').update(edited).digest('hex'));
  expect((await fingerprintText(source.slice(0, 5000) + 'X' + source.slice(5001))).sha256).not.toBe(original.sha256);
});
