import {
  useCallback,
  useId,
  useMemo,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronDown, FolderOpen, Plus } from 'lucide-react';
import { useHighlightedIndex } from '../../hooks/use-highlighted-index';
import type { Folder } from '../../types/index';

interface SelectOption {
  label: string;
  value: string;
}

interface EditorFolderFieldProps {
  folderId: string | null;
  folderOptions: SelectOption[];
  onCreateFolder?: (name: string) => Folder | void;
  onFolderChange: (folderId: string | null) => void;
}

type FolderQuickOption =
  | { id: string; kind: 'none'; label: string }
  | { id: string; kind: 'folder'; label: string; value: string }
  | { id: string; kind: 'create'; label: string; value: string };

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase();
}

export function EditorFolderField({
  folderId,
  folderOptions,
  onCreateFolder,
  onFolderChange,
}: EditorFolderFieldProps) {
  const fieldId = useId();
  const listboxId = `${fieldId}-folders`;
  const [editing, setEditing] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [createdFolderOptions, setCreatedFolderOptions] = useState<SelectOption[]>([]);

  const folderChoices = useMemo(() => {
    const choices = new Map<string, SelectOption>();

    for (const option of folderOptions) {
      if (option.value !== '') {
        choices.set(option.value, option);
      }
    }

    for (const option of createdFolderOptions) {
      choices.set(option.value, option);
    }

    return Array.from(choices.values());
  }, [createdFolderOptions, folderOptions]);

  const selectedFolder = useMemo(
    () => folderChoices.find((option) => option.value === folderId),
    [folderChoices, folderId],
  );

  const quickFolderOptions = useMemo(() => {
    const trimmedInput = folderInput.trim();
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

    if (trimmedInput !== '' && !exactFolder && onCreateFolder) {
      options.push({
        id: `create-${query}`,
        kind: 'create',
        label: `Create "${trimmedInput}"`,
        value: trimmedInput,
      });
    }

    return options.slice(0, 7);
  }, [folderChoices, folderInput, onCreateFolder]);

  const {
    highlightedIndex,
    moveHighlightedIndex,
    setHighlightedIndex,
  } = useHighlightedIndex(quickFolderOptions.length, folderInput);
  const clampedHighlightedIndex =
    quickFolderOptions.length > 0 ? Math.min(highlightedIndex, quickFolderOptions.length - 1) : -1;
  const activeOptionId =
    clampedHighlightedIndex >= 0 ? `${listboxId}-option-${clampedHighlightedIndex}` : undefined;

  const closeEditor = useCallback(() => {
    setEditing(false);
    setFolderInput('');
  }, []);

  const openEditor = useCallback(() => {
    setEditing(true);
    setFolderInput('');
  }, []);

  const selectFolderOption = useCallback(
    (option: FolderQuickOption) => {
      if (option.kind === 'none') {
        onFolderChange(null);
        closeEditor();
        return;
      }

      if (option.kind === 'folder') {
        onFolderChange(option.value);
        closeEditor();
        return;
      }

      const createdFolder = onCreateFolder?.(option.value);
      if (createdFolder) {
        const createdOption = {
          label: createdFolder.name,
          value: createdFolder.id,
        };
        setCreatedFolderOptions((prev) =>
          prev.some((item) => item.value === createdOption.value)
            ? prev
            : [...prev, createdOption],
        );
        onFolderChange(createdFolder.id);
      }
      closeEditor();
    },
    [closeEditor, onCreateFolder, onFolderChange],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveHighlightedIndex(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveHighlightedIndex(-1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (clampedHighlightedIndex >= 0) {
          selectFolderOption(quickFolderOptions[clampedHighlightedIndex]);
        } else {
          closeEditor();
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
      }
    },
    [
      clampedHighlightedIndex,
      closeEditor,
      moveHighlightedIndex,
      quickFolderOptions,
      selectFolderOption,
    ],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const nextFocus = event.relatedTarget;
      if (nextFocus instanceof Node && event.currentTarget.contains(nextFocus)) return;
      closeEditor();
    },
    [closeEditor],
  );

  return (
    <div className="flex flex-col gap-1.5" onBlur={handleBlur}>
      <label
        htmlFor={editing ? fieldId : undefined}
        className="text-sm font-medium text-[var(--color-text-main)]"
      >
        Folder
      </label>

      <div className="relative">
        {editing ? (
          <>
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-panel)] px-3 py-2.5 text-sm ring-2 ring-[var(--color-primary)]/20">
              <FolderOpen className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              <input
                id={fieldId}
                type="text"
                value={folderInput}
                onChange={(event) => setFolderInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                autoFocus
                placeholder={selectedFolder?.label ?? 'Folder name'}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                aria-label="Folder"
                aria-autocomplete="list"
                aria-controls={quickFolderOptions.length > 0 ? listboxId : undefined}
                aria-expanded={quickFolderOptions.length > 0}
                aria-haspopup="listbox"
                aria-activedescendant={activeOptionId}
                role="combobox"
              />
            </div>

            {quickFolderOptions.length > 0 && (
              <div
                id={listboxId}
                role="listbox"
                aria-label="Folders"
                className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-lg"
              >
                {quickFolderOptions.map((option, index) => (
                  <button
                    key={`${option.kind}-${option.id}`}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === clampedHighlightedIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectFolderOption(option)}
                    className={[
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                      index === clampedHighlightedIndex
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-main)] hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {option.kind === 'create' ? (
                      <Plus className="h-4 w-4 shrink-0" />
                    ) : (
                      <FolderOpen className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    )}
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            role="combobox"
            aria-label="Folder"
            aria-expanded={false}
            aria-haspopup="listbox"
            onClick={openEditor}
            className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm transition-colors hover:border-gray-300"
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <span
              className={[
                'min-w-0 flex-1 truncate text-left',
                selectedFolder ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-placeholder)]',
              ].join(' ')}
            >
              {selectedFolder?.label ?? 'No folder'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
          </button>
        )}
      </div>
    </div>
  );
}
