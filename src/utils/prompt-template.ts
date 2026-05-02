import { VariableParser } from '../services/variable-parser';

export interface PromptTemplatePart {
  text: string;
  isVariable: boolean;
}

const variableParser = new VariableParser();
const TEMPLATE_VARIABLE_TOKEN = /^{{\w+}}$/;

export function extractVariables(body: string): string[] {
  return variableParser.parse(body);
}

export function splitPromptTemplateParts(text: string): PromptTemplatePart[] {
  return text.split(/({{\w+}})/g).map((part) => ({
    text: part,
    isVariable: TEMPLATE_VARIABLE_TOKEN.test(part),
  }));
}

export function renderPromptTemplate(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(/{{(\w+)}}/g, (_match, name: string) => {
    return values[name] || `{{${name}}}`;
  });
}

export function areAllPromptVariablesFilled(
  variables: string[],
  values: Record<string, string>,
): boolean {
  return variables.every((variable) => (values[variable] ?? '').trim().length > 0);
}
