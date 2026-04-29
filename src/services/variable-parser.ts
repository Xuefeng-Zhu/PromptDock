import type { IVariableParser } from './interfaces';

export class VariableParser implements IVariableParser {
  parse(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const seen = new Set<string>();
    const result: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      const name = match[1].trim();
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }
    return result;
  }
}
