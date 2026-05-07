import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Folder, PromptRecipe, PromptVariable } from '../types/index';
import type { PromptJsonDraft } from '../services/prompt-json';
import { extractVariables } from '../utils/prompt-template';
import {
  arePromptVariablesEqual,
  createDefaultPromptVariable,
  findDropdownWithInvalidDefault,
  resolvePromptVariables,
} from '../utils/prompt-variables';
import { normalizeTag, resolveExistingTagName } from '../utils/tag-options';
import { countChars, countWords } from '../utils/text-counts';

interface UsePromptEditorFormOptions {
  availableTags?: string[];
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

function resolveTagList(availableTags: string[], tagValues: string[]): string[] {
  const tagsByKey = new Map<string, string>();

  for (const tag of tagValues) {
    const resolvedTag = resolveExistingTagName(availableTags, tag);
    const key = normalizeTag(resolvedTag);

    if (key && !tagsByKey.has(key)) {
      tagsByKey.set(key, resolvedTag);
    }
  }

  return Array.from(tagsByKey.values());
}

export function usePromptEditorForm({
  availableTags = [],
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
  const [variableDefinitions, setVariableDefinitions] = useState(() =>
    resolvePromptVariables(prompt?.body ?? '', prompt?.variables),
  );

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description);
      setBody(prompt.body);
      setTags([...prompt.tags]);
      setFolderId(prompt.folderId);
      setFavorite(prompt.favorite);
      setVariableDefinitions(resolvePromptVariables(prompt.body, prompt.variables));
      return;
    }

    setTitle('');
    setDescription('');
    setBody('');
    setTags([]);
    setFolderId(null);
    setFavorite(false);
    setVariableDefinitions([]);
  }, [prompt]);

  const variables = useMemo(() => extractVariables(body), [body]);
  const promptVariables = useMemo(
    () => resolvePromptVariables(body, variableDefinitions),
    [body, variableDefinitions],
  );
  const initialPromptVariables = useMemo(
    () => resolvePromptVariables(prompt?.body ?? '', prompt?.variables),
    [prompt],
  );
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
      !arePromptVariablesEqual(promptVariables, initialPromptVariables) ||
      tagInput.trim().length > 0
    );
  }, [
    body,
    description,
    favorite,
    folderId,
    initialPromptVariables,
    prompt,
    promptVariables,
    tagInput,
    tags,
    title,
  ]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const addTagValue = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed) {
      const existingTag = resolveExistingTagName(availableTags, trimmed);

      setTags((prev) =>
        prev.some((current) => normalizeTag(current) === normalizeTag(existingTag))
          ? prev
          : [...prev, existingTag],
      );
    }
    setTagInput('');
    setShowTagInput(false);
  }, [availableTags]);

  const handleAddTag = useCallback(() => {
    addTagValue(tagInput);
  }, [addTagValue, tagInput]);

  const handleSelectTag = useCallback((tag: string) => {
    addTagValue(tag);
  }, [addTagValue]);

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

  const handleVariableDefinitionChange = useCallback(
    (
      name: string,
      changes: Partial<Pick<
        PromptVariable,
        'defaultValue' | 'description' | 'inputType' | 'options'
      >>,
    ) => {
      setVariableDefinitions((prev) => {
        const existing = prev.find((variable) => variable.name === name)
          ?? createDefaultPromptVariable(name);
        const updated = { ...existing, ...changes };
        return [...prev.filter((variable) => variable.name !== name), updated];
      });
    },
    [],
  );

  const applyJsonDraft = useCallback((data: PromptJsonDraft) => {
    setTitle(data.title);
    setDescription(data.description);
    setBody(data.body);
    setVariableDefinitions(resolvePromptVariables(data.body));
    setTags(resolveTagList(availableTags, data.tags));
    setFolderId(data.folderId);
    setFavorite(data.favorite);
    setTagInput('');
    setShowTagInput(false);
    setValidationError(null);
    setVariableValues({});
  }, [availableTags]);

  const savePrompt = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const dropdownWithoutOptions = promptVariables.find(
      (variable) =>
        variable.inputType === 'dropdown' && variable.options.length === 0,
    );
    const dropdownWithInvalidDefault =
      findDropdownWithInvalidDefault(promptVariables);

    if (!trimmedTitle) {
      setValidationError('Title is required.');
      return;
    }
    if (!trimmedBody) {
      setValidationError('Body is required.');
      return;
    }
    if (dropdownWithoutOptions) {
      setValidationError(
        `Add at least one dropdown option for ${dropdownWithoutOptions.name}.`,
      );
      return;
    }
    if (dropdownWithInvalidDefault) {
      setValidationError(
        `Default value for ${dropdownWithInvalidDefault.name} must match one of its dropdown options.`,
      );
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        body,
        variables: promptVariables,
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
  }, [body, description, favorite, folderId, onSave, promptVariables, tags, title]);

  const handleVariableValueChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleResetPreview = useCallback(() => {
    setVariableValues({});
  }, []);

  const renderedPreview = useMemo(() => {
    if (!body) return '';
    let result = body;
    for (const variable of promptVariables) {
      const value = variableValues[variable.name] ?? variable.defaultValue;
      if (value) {
        result = result.replaceAll(`{{${variable.name}}}`, value);
      }
    }
    return result;
  }, [body, promptVariables, variableValues]);

  return {
    applyJsonDraft,
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
    handleSelectTag,
    handleTagKeyDown,
    handleVariableDefinitionChange,
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
    promptVariables,
    variables,
    wordCount,
  };
}
