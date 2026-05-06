import { describe, expect, it } from 'vitest';
import {
  arePromptVariablesEqual,
  createDefaultPromptVariable,
  parsePromptVariableOptions,
  resolvePromptVariables,
} from '../prompt-variables';

describe('prompt variable metadata helpers', () => {
  it('resolves body placeholders to default text variables', () => {
    expect(resolvePromptVariables('Hello {{name}} in {{tone}}')).toEqual([
      createDefaultPromptVariable('name'),
      createDefaultPromptVariable('tone'),
    ]);
  });

  it('preserves configured metadata in first-placeholder order', () => {
    const resolved = resolvePromptVariables('Use {{tone}} for {{context}}', [
      {
        name: 'context',
        defaultValue: '',
        description: 'Long context',
        inputType: 'textarea',
        options: [],
      },
      {
        name: 'tone',
        defaultValue: 'Friendly',
        description: 'Voice',
        inputType: 'dropdown',
        options: ['Friendly', 'Professional'],
      },
    ]);

    expect(resolved.map((variable) => variable.name)).toEqual(['tone', 'context']);
    expect(resolved[0].inputType).toBe('dropdown');
    expect(resolved[0].options).toEqual(['Friendly', 'Professional']);
    expect(resolved[1].inputType).toBe('textarea');
  });

  it('drops stale metadata for variables no longer present in the body', () => {
    const resolved = resolvePromptVariables('Hello {{name}}', [
      {
        name: 'stale',
        defaultValue: 'old',
        description: '',
        inputType: 'text',
        options: [],
      },
    ]);

    expect(resolved).toEqual([createDefaultPromptVariable('name')]);
  });

  it('ignores malformed metadata and falls back to placeholder defaults', () => {
    expect(resolvePromptVariables('Hello {{name}}', 'not an array')).toEqual([
      createDefaultPromptVariable('name'),
    ]);
    expect(resolvePromptVariables('Hello {{name}}', [42, null])).toEqual([
      createDefaultPromptVariable('name'),
    ]);
  });

  it('parses comma and newline separated dropdown options', () => {
    expect(parsePromptVariableOptions('Friendly, Professional\nConcise\nFriendly')).toEqual([
      'Friendly',
      'Professional',
      'Concise',
    ]);
  });

  it('compares variable definitions deeply', () => {
    const left = resolvePromptVariables('Hello {{tone}}', [
      {
        name: 'tone',
        defaultValue: 'Friendly',
        description: '',
        inputType: 'dropdown',
        options: ['Friendly'],
      },
    ]);
    const right = resolvePromptVariables('Hello {{tone}}', [
      {
        name: 'tone',
        defaultValue: 'Friendly',
        description: '',
        inputType: 'dropdown',
        options: ['Friendly'],
      },
    ]);

    expect(arePromptVariablesEqual(left, right)).toBe(true);
    expect(
      arePromptVariablesEqual(left, [
        { ...right[0], options: ['Professional'] },
      ]),
    ).toBe(false);
  });
});
