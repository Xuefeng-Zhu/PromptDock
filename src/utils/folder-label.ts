const GENERATED_FOLDER_SUFFIX = /-\d{13}$/;

export function formatFolderLabel(folderId: string): string {
  const cleaned = folderId
    .replace(/^folder-/, '')
    .replace(GENERATED_FOLDER_SUFFIX, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  if (cleaned === '') return folderId;

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}
