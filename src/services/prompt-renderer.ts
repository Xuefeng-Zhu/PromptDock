import type { RenderResult } from '../types/index';
import type { IPromptRenderer } from './interfaces';
import { VariableParser } from './variable-parser';

/**
 * Substitutes {{variable_name}} placeholders in prompt templates with provided values.
 * Returns rendered text on success, or a list of missing variable names on failure.
 */
export class PromptRenderer implements IPromptRenderer {
  private readonly parser: VariableParser;

  constructor(parser?: VariableParser) {
    this.parser = parser ?? new VariableParser();
  }

  /**
   * Render a template by substituting all {{variable_name}} placeholders with values.
   *
   * - If all variables have corresponding values, returns { success: true, text }.
   * - If any variables are missing from the values map, returns { success: false, missingVariables }.
   * - If the template has no variables, returns the template unchanged.
   */
  render(template: string, values: Record<string, string>): RenderResult {
    const variables = this.parser.parse(template);

    // No variables — return template as-is
    if (variables.length === 0) {
      return { success: true, text: template };
    }

    // Copy values into a null-prototype object to safely handle keys like
    // "__proto__", "toString", "constructor", etc.
    const safeValues: Record<string, string> = Object.create(null);
    for (const key of Object.keys(values)) {
      safeValues[key] = values[key];
    }

    // Check for missing variables
    const missingVariables = variables.filter((name) => !(name in safeValues));

    if (missingVariables.length > 0) {
      return { success: false, missingVariables };
    }

    // Replace all occurrences of each variable placeholder
    let rendered = template;
    for (const name of variables) {
      // Use a global regex to replace ALL occurrences of {{name}}
      const pattern = new RegExp(`\\{\\{${escapeRegExp(name)}\\}\\}`, 'g');
      // Use a replacer function to avoid special $-pattern interpretation
      // (e.g. $& re-inserts the match, $' inserts text after the match, etc.)
      const value = safeValues[name];
      rendered = rendered.replace(pattern, () => value);
    }

    return { success: true, text: rendered };
  }
}

/**
 * Escape special regex characters in a string so it can be used in a RegExp constructor.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
