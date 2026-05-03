import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export function useInlineFolderCreate(onCreateFolder?: (name: string) => void) {
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderInputValue, setFolderInputValue] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);

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
    const trimmed = folderInputValue.trim();
    if (trimmed && onCreateFolder) {
      onCreateFolder(trimmed);
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
