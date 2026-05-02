import { describe, expect, it } from 'vitest';
import {
  areAllPromptVariablesFilled,
  extractVariables,
  renderPromptTemplate,
  splitPromptTemplateParts,
} from '../prompt-template';

describe('prompt-template utilities', () => {
  it('extracts unique variables in first-appearance order', () => {
    expect(extractVariables('Hello {{name}}, meet {{tool}}. Bye {{name}}.')).toEqual([
      'name',
      'tool',
    ]);
  });

  it('splits template text into variable and plain-text parts', () => {
    expect(splitPromptTemplateParts('A {{first}} B {{second}}')).toEqual([
      { text: 'A ', isVariable: false },
      { text: '{{first}}', isVariable: true },
      { text: ' B ', isVariable: false },
      { text: '{{second}}', isVariable: true },
      { text: '', isVariable: false },
    ]);
  });

  it('renders filled variables and leaves missing values as placeholders', () => {
    expect(renderPromptTemplate('Hello {{name}} from {{place}}.', { name: 'Ada' })).toBe(
      'Hello Ada from {{place}}.',
    );
  });

  it('treats blank variable values as unfilled', () => {
    expect(
      areAllPromptVariablesFilled(['name', 'place'], {
        name: 'Ada',
        place: '   ',
      }),
    ).toBe(false);
    expect(
      areAllPromptVariablesFilled(['name', 'place'], {
        name: 'Ada',
        place: 'London',
      }),
    ).toBe(true);
  });
});
