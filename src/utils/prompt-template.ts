import { VariableParser } from '../services/variable-parser';

export interface PromptTemplatePart {
  text: string;
  isVariable: boolean;
}

const variableParser = new VariableParser();
const TEMPLATE_VARIABLE_TOKEN = /^{{\w+}}$/;

/**
 * Extracts unique `{{variable}}` names from a prompt body.
 * Ordering follows first appearance in the template and names are case-sensitive.
 */
export function extractVariables(body: string): string[] {
  return variableParser.parse(body);
}

/**
 * Splits template text into renderable text and variable-token segments.
 * Used by preview/highlighting UI; only exact `{{word}}` tokens become variables.
 */
export function splitPromptTemplateParts(text: string): PromptTemplatePart[] {
  return text.split(/({{\w+}})/g).map((part) => ({
    text: part,
    isVariable: TEMPLATE_VARIABLE_TOKEN.test(part),
  }));
}

/**
 * Renders a prompt body by replacing variables with supplied non-empty values.
 * Missing or empty values leave the original placeholder intact for the user.
 */
export function renderPromptTemplate(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(/{{(\w+)}}/g, (_match, name: string) => {
    return values[name] || `{{${name}}}`;
  });
}

/**
 * Validates that every extracted variable has a non-blank value before execution.
 */
export function areAllPromptVariablesFilled(
  variables: string[],
  values: Record<string, string>,
): boolean {
  return variables.every((variable) => (values[variable] ?? '').trim().length > 0);
}
