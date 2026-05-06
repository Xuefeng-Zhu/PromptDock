import { AlignLeft, List, Type } from 'lucide-react';
import type {
  PromptVariable,
  PromptVariableInputType,
} from '../../types/index';
import {
  formatPromptVariableOptions,
  parsePromptVariableOptions,
} from '../../utils/prompt-variables';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface VariableDefinitionEditorProps {
  variables: PromptVariable[];
  onVariableChange: (
    name: string,
    changes: Partial<Pick<
      PromptVariable,
      'defaultValue' | 'description' | 'inputType' | 'options'
    >>,
  ) => void;
}

const VARIABLE_TYPE_OPTIONS: Array<{
  value: PromptVariableInputType;
  label: string;
  icon: typeof Type;
}> = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Textarea', icon: AlignLeft },
  { value: 'dropdown', label: 'Dropdown', icon: List },
];

export function VariableDefinitionEditor({
  variables,
  onVariableChange,
}: VariableDefinitionEditorProps) {
  if (variables.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="variable-controls-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="variable-controls-heading"
          className="text-sm font-semibold text-[var(--color-text-main)]"
        >
          Variable controls
        </h2>
      </div>

      <div className="space-y-3">
        {variables.map((variable) => (
          <div
            key={variable.name}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
          >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-[var(--font-mono)] text-sm font-semibold text-[var(--color-primary)]">
                  {`{{${variable.name}}}`}
                </p>
              </div>

              <div
                className="inline-flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-0.5 sm:w-auto"
                role="group"
                aria-label={`Input type for ${variable.name}`}
              >
                {VARIABLE_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = variable.inputType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Use ${option.label.toLowerCase()} input for ${variable.name}`}
                      onClick={() =>
                        onVariableChange(variable.name, { inputType: option.value })
                      }
                      className={[
                        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none',
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text-main)]',
                      ].join(' ')}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={`Description for ${variable.name}`}
                value={variable.description}
                onChange={(event) =>
                  onVariableChange(variable.name, {
                    description: event.target.value,
                  })
                }
                placeholder="Optional helper text"
              />

              <Input
                label={`Default value for ${variable.name}`}
                value={variable.defaultValue}
                onChange={(event) =>
                  onVariableChange(variable.name, {
                    defaultValue: event.target.value,
                  })
                }
                placeholder="Optional default"
              />
            </div>

            {variable.inputType === 'dropdown' && (
              <div className="mt-3">
                <Textarea
                  label={`Options for ${variable.name}`}
                  value={formatPromptVariableOptions(variable.options)}
                  rows={3}
                  onChange={(event) =>
                    onVariableChange(variable.name, {
                      options: parsePromptVariableOptions(event.target.value),
                    })
                  }
                  placeholder={'Friendly\nProfessional\nConcise'}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
