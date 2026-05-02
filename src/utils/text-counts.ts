export function countWords(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\s+/).filter((token) => token.length > 0).length;
}

export function countChars(text: string): number {
  return text.length;
}
