export function cleanFolderName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeFolderName(name: string): string {
  return cleanFolderName(name).toLowerCase();
}

export function createFolderId(name: string): string {
  const slug = normalizeFolderName(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `folder-${slug || 'untitled'}-${suffix}`;
}
