import { normalizeFolderName } from './folder-names';

export interface FolderOption {
  label: string;
  value: string;
}

export type FolderQuickOption =
  | { id: string; kind: 'none'; label: string }
  | { id: string; kind: 'folder'; label: string; value: string }
  | { id: string; kind: 'create'; label: string; value: string };

interface GetQuickFolderOptionsInput {
  canCreateFolder: boolean;
  folderChoices: FolderOption[];
  input: string;
  limit?: number;
}

export function getQuickFolderOptions({
  canCreateFolder,
  folderChoices,
  input,
  limit = 7,
}: GetQuickFolderOptionsInput): FolderQuickOption[] {
  const trimmedInput = input.trim();
  const query = normalizeFolderName(trimmedInput);
  const exactFolder = folderChoices.find(
    (option) => normalizeFolderName(option.label) === query,
  );
  const matchingFolders = folderChoices.filter((option) =>
    normalizeFolderName(option.label).includes(query),
  );
  const options: FolderQuickOption[] = [];

  if (query === '') {
    options.push({ id: 'none', kind: 'none', label: 'No folder' });
  }

  options.push(
    ...matchingFolders.map((option) => ({
      id: option.value,
      kind: 'folder' as const,
      label: option.label,
      value: option.value,
    })),
  );

  if (trimmedInput !== '' && !exactFolder && canCreateFolder) {
    options.push({
      id: `create-${query}`,
      kind: 'create',
      label: `Create "${trimmedInput}"`,
      value: trimmedInput,
    });
  }

  return options.slice(0, limit);
}
