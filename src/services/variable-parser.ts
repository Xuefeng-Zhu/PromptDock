import type { IVariableParser } from './interfaces';

/**
 * Extracts unique variable names from prompt templates using {{variable_name}} syntax.
 * Variables are returned in first-appearance order and treated as case-sensitive.
 */
export class VariableParser implements IVariableParser {
  private static readonly VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

  /**
   * Parse a template string and extract unique variable names in first-appearance order.
   * Variable names are case-sensitive: {{Name}} and {{name}} are distinct.
   * Duplicate placeholders are deduplicated — each name appears only once.
   * Returns an empty array if no variables are found.
   */
  parse(template: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = VariableParser.VARIABLE_PATTERN.exec(template)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }

    return result;
  }
}
