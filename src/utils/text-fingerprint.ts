export interface TextFingerprint {
  utf8Bytes: number;
  sha256: string;
}

/** Hashes every UTF-8 byte without trimming, normalizing line endings, or rendering variables. */
export async function fingerprintText(text: string): Promise<TextFingerprint> {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return {
    utf8Bytes: bytes.byteLength,
    sha256: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
}
