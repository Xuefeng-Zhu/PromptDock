import { useState } from 'react';
import { FileInput } from '../ui/FileInput';

/** Loads the complete text into the draft; saving remains an explicit editor action. */
export function BodyFileImport({ onBodyChange }: { onBodyChange: (body: string) => void }) {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string>();

  async function loadFile(file: File) {
    setIsReading(true);
    setError(undefined);
    try {
      onBodyChange(await file.text());
    } catch {
      setError('Could not read the text file. Your draft body has not changed.');
    } finally {
      setIsReading(false);
    }
  }

  return (
    <div className="mb-3 max-w-md">
      <FileInput
        label="Load text file"
        accept=".txt,text/plain"
        disabled={isReading}
        error={error}
        hint="Replaces the draft body with the complete UTF-8 text. Review it before saving."
        onFileSelect={(file) => void loadFile(file)}
      />
    </div>
  );
}
