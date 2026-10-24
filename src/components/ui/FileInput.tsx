import { Input, type InputProps } from './Input';

interface FileInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange' | 'multiple'> {
  onFileSelect: (file: File) => void;
}

/** A persistent file control that allows selecting the same file again after validation errors. */
export function FileInput({ onFileSelect, ...props }: FileInputProps) {
  return (
    <Input
      {...props}
      type="file"
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) onFileSelect(file);
      }}
      className={`min-w-0 w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-[var(--color-primary-light)] file:px-2 file:py-1 file:text-[var(--color-primary)] ${props.className ?? ''}`}
    />
  );
}
