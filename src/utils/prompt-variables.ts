import type {
  PromptRecipe,
  PromptVariable,
  PromptVariableInputType,
} from '../types/index';
import { extractVariables } from './prompt-template';

export const PROMPT_VARIABLE_INPUT_TYPES: PromptVariableInputType[] = [
  'text',
  'textarea',
  'dropdown',
];

export function isPromptVariableInputType(
  value: unknown,
): value is PromptVariableInputType {
  return (
    typeof value === 'string'
    && PROMPT_VARIABLE_INPUT_TYPES.includes(value as PromptVariableInputType)
  );
}

export function createDefaultPromptVariable(name: string): PromptVariable {
  return {
    name,
    defaultValue: '',
    description: '',
    inputType: 'text',
    options: [],
  };
}

export function normalizePromptVariableOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const option of options) {
    if (typeof option !== 'string') continue;
    const trimmed = option.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function parsePromptVariableOptions(text: string): string[] {
  return normalizePromptVariableOptions(text.split(/\r?\n|,/));
}

export function formatPromptVariableOptions(options: string[]): string {
  return options.join('\n');
}

export function normalizePromptVariableDefinition(
  variable: Partial<PromptVariable> | undefined,
  fallbackName: string,
): PromptVariable {
  return {
    name:
      typeof variable?.name === 'string' && variable.name.trim()
        ? variable.name.trim()
        : fallbackName,
    defaultValue:
      typeof variable?.defaultValue === 'string' ? variable.defaultValue : '',
    description:
      typeof variable?.description === 'string' ? variable.description : '',
    inputType: isPromptVariableInputType(variable?.inputType)
      ? variable.inputType
      : 'text',
    options: normalizePromptVariableOptions(variable?.options),
  };
}

export function resolvePromptVariables(
  body: string,
  variableDefinitions: PromptVariable[] | undefined = [],
): PromptVariable[] {
  const definitionsByName = new Map<string, PromptVariable>();

  for (const definition of variableDefinitions) {
    const normalized = normalizePromptVariableDefinition(
      definition,
      definition.name,
    );
    definitionsByName.set(normalized.name, normalized);
  }

  return extractVariables(body).map((name) =>
    normalizePromptVariableDefinition(definitionsByName.get(name), name),
  );
}

export function resolvePromptRecipeVariables(prompt: PromptRecipe): PromptVariable[] {
  return resolvePromptVariables(prompt.body, prompt.variables);
}

export function arePromptVariablesEqual(
  left: PromptVariable[],
  right: PromptVariable[],
): boolean {
  if (left.length !== right.length) return false;

  return left.every((variable, index) => {
    const other = right[index];
    return (
      variable.name === other.name
      && variable.defaultValue === other.defaultValue
      && variable.description === other.description
      && variable.inputType === other.inputType
      && variable.options.length === other.options.length
      && variable.options.every((option, optionIndex) => option === other.options[optionIndex])
    );
  });
}
