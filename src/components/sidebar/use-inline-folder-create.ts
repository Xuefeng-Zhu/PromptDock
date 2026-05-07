import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export type InlineFolderCreateHandler = (name: string) => void | Promise<unknown>;

export function useInlineFolderCreate(onCreateFolder?: InlineFolderCreateHandler) {
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderInputValue, setFolderInputValue] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (showFolderInput && folderInputRef.current) {
      folderInputRef.current.focus();
    }
  }, [showFolderInput]);

  const closeFolderInput = useCallback(() => {
    setFolderInputValue('');
    setShowFolderInput(false);
  }, []);

  const submitFolderInput = useCallback(() => {
    if (submittingRef.current) return;

    const trimmed = folderInputValue.trim();
    if (trimmed && onCreateFolder) {
      submittingRef.current = true;
      void Promise.resolve(onCreateFolder(trimmed))
        .catch(() => undefined)
        .finally(() => {
          submittingRef.current = false;
        });
    }
    closeFolderInput();
  }, [closeFolderInput, folderInputValue, onCreateFolder]);

  const handleFolderInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitFolderInput();
      }
      if (event.key === 'Escape') {
        closeFolderInput();
      }
    },
    [closeFolderInput, submitFolderInput],
  );

  return {
    folderInputRef,
    folderInputValue,
    handleFolderInputKeyDown,
    setFolderInputValue,
    setShowFolderInput,
    showFolderInput,
    submitFolderInput,
  };
}
