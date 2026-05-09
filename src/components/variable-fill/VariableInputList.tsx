import type { ChangeEvent, Ref } from 'react';
import type { PromptVariable } from '../../types/index';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

type VariableInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface VariableInputListProps {
  firstInputRef: Ref<VariableInputElement>;
  onValueChange: (variableName: string, value: string) => void;
  values: Record<string, string>;
  variables: PromptVariable[];
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
        {variables.map((variable, index) => {
          const value = values[variable.name] ?? '';
          const inputId = `variable-fill-${variable.name}`;
          const descriptionId = variable.description
            ? `${inputId}-description`
            : undefined;
          const commonProps = {
            label: variable.name,
            value,
            placeholder: `Enter value for ${variable.name}`,
            'aria-label': `Value for variable ${variable.name}`,
            onChange: (
              event:
                | ChangeEvent<HTMLInputElement>
                | ChangeEvent<HTMLTextAreaElement>,
            ) => onValueChange(variable.name, event.target.value),
          };

          if (variable.inputType === 'textarea') {
            return (
              <div key={variable.name}>
                <Textarea
                  ref={index === 0 ? firstInputRef as Ref<HTMLTextAreaElement> : undefined}
                  {...commonProps}
                  rows={5}
                  aria-describedby={descriptionId}
                />
                {variable.description && (
                  <p
                    id={descriptionId}
                    className="mt-1.5 text-xs text-[var(--color-text-muted)]"
                  >
                    {variable.description}
                  </p>
                )}
              </div>
            );
          }

          if (variable.inputType === 'dropdown') {
            return (
              <div key={variable.name} className="flex flex-col gap-1.5">
                <label
                  htmlFor={inputId}
                  className="text-sm font-medium text-[var(--color-text-main)]"
                >
                  {variable.name}
                </label>
                <select
                  id={inputId}
                  ref={index === 0 ? firstInputRef as Ref<HTMLSelectElement> : undefined}
                  value={value}
                  onChange={(event) => onValueChange(variable.name, event.target.value)}
                  aria-label={`Value for variable ${variable.name}`}
                  aria-describedby={descriptionId}
                  className={[
                    'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition-colors',
                    'bg-[var(--color-panel)] text-[var(--color-text-main)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                  ].join(' ')}
                >
                  <option value="">Select value for {variable.name}</option>
                  {variable.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {variable.description && (
                  <p
                    id={descriptionId}
                    className="text-xs text-[var(--color-text-muted)]"
                  >
                    {variable.description}
                  </p>
                )}
              </div>
            );
          }

          return (
            <Input
              key={variable.name}
              ref={index === 0 ? firstInputRef as Ref<HTMLInputElement> : undefined}
              {...commonProps}
              hint={variable.description || undefined}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
