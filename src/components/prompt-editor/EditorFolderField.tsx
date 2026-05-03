import { Select } from '../ui/Select';

interface SelectOption {
  label: string;
  value: string;
}

interface EditorFolderFieldProps {
  folderId: string | null;
  folderOptions: SelectOption[];
  onFolderChange: (folderId: string | null) => void;
}

export function EditorFolderField({
  folderId,
  folderOptions,
  onFolderChange,
}: EditorFolderFieldProps) {
  return (
    <Select
      label="Folder"
      options={folderOptions}
      value={folderId ?? ''}
      onChange={(event) => onFolderChange(event.target.value || null)}
      placeholder="Select a folder"
    />
  );
}
