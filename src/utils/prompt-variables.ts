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

/**
 * Runtime type guard for persisted or imported variable input types.
 * Keeps invalid external values from flowing into prompt editor controls.
 */
export function isPromptVariableInputType(
  value: unknown,
): value is PromptVariableInputType {
  return (
    typeof value === 'string'
    && PROMPT_VARIABLE_INPUT_TYPES.includes(value as PromptVariableInputType)
  );
}

/**
 * Creates the baseline metadata for a placeholder discovered in a prompt body.
 * Callers can later enrich this with descriptions, defaults, or dropdown options.
 */
export function createDefaultPromptVariable(name: string): PromptVariable {
  return {
    name,
    defaultValue: '',
    description: '',
    inputType: 'text',
    options: [],
  };
}

/**
 * Normalizes option arrays from forms, imports, and storage.
 * Trims labels, drops non-string or empty values, removes exact duplicates,
 * and preserves the user's first-seen ordering and casing.
 */
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

/**
 * Parses the textarea representation used by the editor into dropdown options.
 * Both comma-separated and newline-separated input are accepted.
 */
export function parsePromptVariableOptions(text: string): string[] {
  return normalizePromptVariableOptions(text.split(/\r?\n|,/));
}

export function formatPromptVariableOptions(options: string[]): string {
  return options.join('\n');
}

/**
 * Coerces partial variable metadata into a complete PromptVariable.
 * Invalid or missing fields are replaced with editor-safe defaults while the
 * provided fallback name keeps template-discovered variables addressable.
 */
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

function isPartialPromptVariable(value: unknown): value is Partial<PromptVariable> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reconciles variable definitions with the placeholders currently in a prompt body.
 * The template controls the returned order and membership: stale definitions are
 * dropped, repeated placeholders are deduped, and missing metadata is defaulted.
 */
export function resolvePromptVariables(
  body: string,
  variableDefinitions: unknown = [],
): PromptVariable[] {
  const definitionsByName = new Map<string, PromptVariable>();
  const definitions = Array.isArray(variableDefinitions)
    ? variableDefinitions
    : [];

  for (const definition of definitions) {
    if (!isPartialPromptVariable(definition)) continue;

    const normalized = normalizePromptVariableDefinition(
      definition,
      typeof definition.name === 'string' ? definition.name : '',
    );
    if (!normalized.name) continue;

    definitionsByName.set(normalized.name, normalized);
  }

  return extractVariables(body).map((name) =>
    normalizePromptVariableDefinition(definitionsByName.get(name), name),
  );
}

export function resolvePromptRecipeVariables(prompt: PromptRecipe): PromptVariable[] {
  return resolvePromptVariables(prompt.body, prompt.variables);
}

/**
 * Finds the first dropdown variable whose default no longer appears in its options.
 * Useful after option edits or JSON imports where defaults can become stale.
 */
export function findDropdownWithInvalidDefault(
  variables: PromptVariable[],
): PromptVariable | undefined {
  return variables.find(
    (variable) =>
      variable.inputType === 'dropdown'
      && variable.defaultValue.length > 0
      && !variable.options.includes(variable.defaultValue),
  );
}

/**
 * Compares variable definitions by ordered field values, including option order.
 * The prompt body determines variable order, so reordering is treated as a change.
 */
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
