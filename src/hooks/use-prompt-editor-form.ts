import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Folder, PromptRecipe } from '../types/index';
import { extractVariables } from '../utils/prompt-template';
import { countChars, countWords } from '../utils/text-counts';

interface UsePromptEditorFormOptions {
  folders: Folder[];
  onDirtyChange?: (isDirty: boolean) => void;
  onSave: (data: Partial<PromptRecipe>) => void | Promise<void>;
  prompt?: PromptRecipe;
  promptId?: string;
}

function areTagsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((tag, index) => tag === right[index]);
}

export function usePromptEditorForm({
  folders,
  onDirtyChange,
  onSave,
  prompt,
  promptId,
}: UsePromptEditorFormOptions) {
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [body, setBody] = useState(prompt?.body ?? '');
  const [tags, setTags] = useState<string[]>(prompt?.tags ? [...prompt.tags] : []);
  const [folderId, setFolderId] = useState<string | null>(prompt?.folderId ?? null);
  const [favorite, setFavorite] = useState(prompt?.favorite ?? false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description);
      setBody(prompt.body);
      setTags([...prompt.tags]);
      setFolderId(prompt.folderId);
      setFavorite(prompt.favorite);
    }
  }, [prompt]);

  const variables = useMemo(() => extractVariables(body), [body]);
  const wordCount = useMemo(() => countWords(body), [body]);
  const charCount = useMemo(() => countChars(body), [body]);
  const lineCount = useMemo(() => Math.max(body.split('\n').length, 1), [body]);
  const isEditing = Boolean(promptId);
  const currentFolder = useMemo(
    () => folders.find((folder) => folder.id === folderId),
    [folderId, folders],
  );
  const folderOptions = useMemo(
    () => [
      { value: '', label: 'No folder' },
      ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
    ],
    [folders],
  );

  const hasUnsavedChanges = useMemo(() => {
    const initialTags = prompt?.tags ?? [];
    return (
      title !== (prompt?.title ?? '') ||
      description !== (prompt?.description ?? '') ||
      body !== (prompt?.body ?? '') ||
      folderId !== (prompt?.folderId ?? null) ||
      favorite !== (prompt?.favorite ?? false) ||
      !areTagsEqual(tags, initialTags) ||
      tagInput.trim().length > 0
    );
  }, [body, description, favorite, folderId, prompt, tagInput, tags, title]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
    setShowTagInput(false);
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTag();
      }
      if (event.key === 'Escape') {
        setTagInput('');
        setShowTagInput(false);
      }
    },
    [handleAddTag],
  );

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  }, []);

  const handleInsertVariable = useCallback(() => {
    setBody((prev) => prev + '{{variable_name}}');
  }, []);

  const savePrompt = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setValidationError('Title is required.');
      return;
    }
    if (!trimmedBody) {
      setValidationError('Body is required.');
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        body,
        tags,
        folderId,
        favorite,
      });
    } catch (err) {
      setValidationError(
        `Failed to save prompt: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [body, description, favorite, folderId, onSave, tags, title]);

  const handleVariableValueChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleResetPreview = useCallback(() => {
    setVariableValues({});
  }, []);

  const renderedPreview = useMemo(() => {
    if (!body) return '';
    let result = body;
    for (const variable of variables) {
      const value = variableValues[variable];
      if (value) {
        result = result.replaceAll(`{{${variable}}}`, value);
      }
    }
    return result;
  }, [body, variableValues, variables]);

  return {
    body,
    charCount,
    currentFolder,
    description,
    favorite,
    folderId,
    folderOptions,
    handleAddTag,
    handleInsertVariable,
    handleRemoveTag,
    handleResetPreview,
    handleTagKeyDown,
    handleVariableValueChange,
    isEditing,
    isEditorExpanded,
    isSaving,
    lineCount,
    renderedPreview,
    savePrompt,
    setBody,
    setDescription,
    setFavorite,
    setFolderId,
    setIsEditorExpanded,
    setShowFormattingHelp,
    setShowTagInput,
    setTagInput,
    setTitle,
    showFormattingHelp,
    showTagInput,
    tagInput,
    tags,
    title,
    validationError,
    variableValues,
    variables,
    wordCount,
  };
}
