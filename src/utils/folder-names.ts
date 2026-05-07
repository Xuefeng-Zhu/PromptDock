export function cleanFolderName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeFolderName(name: string): string {
  return cleanFolderName(name).toLowerCase();
}

export function createFolderId(name: string): string {
  const slug = normalizeFolderName(name).match(/[a-z0-9]+/g)?.join('-') ?? 'untitled';
  return `folder-${slug}`;
}
