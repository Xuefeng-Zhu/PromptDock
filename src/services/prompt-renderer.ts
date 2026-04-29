import type { RenderResult } from '../types';
import type { IPromptRenderer } from './interfaces';
import { VariableParser } from './variable-parser';

export class PromptRenderer implements IPromptRenderer {
  private parser = new VariableParser();

  render(template: string, values: Record<string, string>): RenderResult {
    const variables = this.parser.parse(template);
    const missing = variables.filter((v) => !(v in values));
    if (missing.length > 0) {
      return { success: false, missingVariables: missing };
    }
    let text = template;
    for (const name of variables) {
      text = text.split(`{{${name}}}`).join(values[name]);
    }
    return { success: true, text };
  }
}
