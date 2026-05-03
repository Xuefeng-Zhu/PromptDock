import type { Ref } from 'react';
import { Input } from '../ui/Input';

interface VariableInputListProps {
  firstInputRef: Ref<HTMLInputElement>;
  onValueChange: (variableName: string, value: string) => void;
  values: Record<string, string>;
  variables: string[];
}

export function VariableInputList({
  firstInputRef,
  onValueChange,
  values,
  variables,
}: VariableInputListProps) {
  if (variables.length === 0) return null;

  return (
    <fieldset>
      <legend className="sr-only">Template Variables</legend>
      <div className="space-y-3">
        {variables.map((varName, index) => (
          <Input
            key={varName}
            ref={index === 0 ? firstInputRef : undefined}
            label={varName}
            value={values[varName] ?? ''}
            onChange={(event) => onValueChange(varName, event.target.value)}
            placeholder={`Enter value for ${varName}`}
            aria-label={`Value for variable ${varName}`}
          />
        ))}
      </div>
    </fieldset>
  );
}
