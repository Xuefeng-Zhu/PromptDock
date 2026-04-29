import { describe, it, expect } from 'vitest';
import { PromptRenderer } from '../prompt-renderer';

describe('PromptRenderer', () => {
  const renderer = new PromptRenderer();

  it('should substitute a single variable', () => {
    const result = renderer.render('Hello {{name}}!', { name: 'Alice' });
    expect(result).toEqual({ success: true, text: 'Hello Alice!' });
  });

  it('should substitute multiple variables', () => {
    const result = renderer.render('{{greeting}} {{name}}, welcome to {{place}}!', {
      greeting: 'Hi',
      name: 'Bob',
      place: 'Wonderland',
    });
    expect(result).toEqual({ success: true, text: 'Hi Bob, welcome to Wonderland!' });
  });

  it('should replace all occurrences of a repeated variable', () => {
    const result = renderer.render('{{name}} met {{name}} and said hi to {{name}}', {
      name: 'Eve',
    });
    expect(result).toEqual({ success: true, text: 'Eve met Eve and said hi to Eve' });
  });

  it('should return template unchanged when no variables are present', () => {
    const template = 'No variables here, just plain text.';
    const result = renderer.render(template, {});
    expect(result).toEqual({ success: true, text: template });
  });

  it('should return missing variables when values are incomplete', () => {
    const result = renderer.render('{{a}} and {{b}} and {{c}}', { a: '1' });
    expect(result).toEqual({ success: false, missingVariables: ['b', 'c'] });
  });

  it('should return all variables as missing when no values provided', () => {
    const result = renderer.render('{{x}} {{y}}', {});
    expect(result).toEqual({ success: false, missingVariables: ['x', 'y'] });
  });

  it('should handle empty template', () => {
    const result = renderer.render('', {});
    expect(result).toEqual({ success: true, text: '' });
  });

  it('should handle variables with underscores and digits', () => {
    const result = renderer.render('{{first_name}} {{item2}}', {
      first_name: 'Jane',
      item2: 'laptop',
    });
    expect(result).toEqual({ success: true, text: 'Jane laptop' });
  });

  it('should treat variable names as case-sensitive', () => {
    const result = renderer.render('{{Name}} and {{name}}', {
      Name: 'Upper',
      name: 'lower',
    });
    expect(result).toEqual({ success: true, text: 'Upper and lower' });
  });

  it('should report case-sensitive missing variables correctly', () => {
    const result = renderer.render('{{Name}} and {{name}}', { name: 'lower' });
    expect(result).toEqual({ success: false, missingVariables: ['Name'] });
  });

  it('should substitute with empty string values', () => {
    const result = renderer.render('Hello {{name}}!', { name: '' });
    expect(result).toEqual({ success: true, text: 'Hello !' });
  });

  it('should handle values containing curly braces', () => {
    const result = renderer.render('Output: {{code}}', { code: '{{not_a_var}}' });
    expect(result).toEqual({ success: true, text: 'Output: {{not_a_var}}' });
  });
});

import * as fc from 'fast-check';

// ─── Generators ────────────────────────────────────────────────────────────────

/** Generates a valid variable name matching \w+ (at least 1 char of [a-zA-Z0-9_]) */
const varNameArb = fc.stringMatching(/^\w{1,20}$/).filter(
  // "__proto__" cannot be stored as an own property on plain JS objects,
  // so exclude it from generated variable names.
  (name) => name !== '__proto__'
);

/**
 * Generates a literal text segment that contains no `{{word}}` patterns.
 * We exclude `{` entirely from the character set to guarantee safety.
 */
const safeLiteralArb = fc.array(
  fc.constantFrom(
    ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=+[]|;:,.<>?/~`\n\t'.split('')
  ),
  { minLength: 0, maxLength: 30 }
).map(arr => arr.join(''));

/**
 * Generates a string value for variable substitution.
 * Values may contain arbitrary text but we avoid `{{word}}` patterns
 * so that Property 7 can verify no original placeholders remain.
 * We exclude `{` from the character set to keep things clean.
 */
const safeValueArb = fc.array(
  fc.constantFrom(
    ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=+[]|;:,.<>?/~`\n\t'.split('')
  ),
  { minLength: 0, maxLength: 30 }
).map(arr => arr.join(''));

/**
 * Generates a string that truly contains no `{{word}}` patterns.
 * We build from characters that exclude `{` entirely.
 */
const variableFreeLiteralArb = fc.array(
  fc.constantFrom(
    ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=+[]|;:,.<>?/~`\n\t'.split('')
  ),
  { minLength: 0, maxLength: 80 }
).map(arr => arr.join(''));

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 7: Prompt Rendering No-Placeholder', () => {
  const renderer = new PromptRenderer();

  /**
   * **Validates: Requirements 13.1, 13.3, 13.5**
   *
   * For any template string and a complete variable value map (a value provided for every
   * detected variable), rendering the template with the Prompt_Renderer SHALL produce output
   * containing none of the original {{variable_name}} placeholders.
   */
  it('should produce output with no original {{variable_name}} placeholders when all values are provided', () => {
    fc.assert(
      fc.property(
        // Generate 1–10 unique variable names
        fc.uniqueArray(varNameArb, { minLength: 1, maxLength: 10 }),
        // Generate literal text segments to intersperse
        fc.array(safeLiteralArb, { minLength: 2, maxLength: 11 }),
        // Generate values for each variable (we'll zip with varNames)
        fc.array(safeValueArb, { minLength: 10, maxLength: 10 }),
        (varNames, literals, rawValues) => {
          // Build a template by interspersing literals and {{varName}} placeholders
          let template = '';
          for (let i = 0; i < varNames.length; i++) {
            template += (literals[i] ?? '') + `{{${varNames[i]}}}`;
          }
          template += literals[varNames.length] ?? '';

          // Build a complete value map
          const values: Record<string, string> = {};
          for (let i = 0; i < varNames.length; i++) {
            values[varNames[i]] = rawValues[i] ?? '';
          }

          const result = renderer.render(template, values);

          // Should succeed
          expect(result.success).toBe(true);
          if (result.success) {
            // The output should contain none of the original {{varName}} placeholders
            for (const name of varNames) {
              expect(result.text).not.toContain(`{{${name}}}`);
            }
            // More broadly, no {{word}} pattern should remain
            expect(result.text).not.toMatch(/\{\{\w+\}\}/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 8: Prompt Rendering Identity for Variable-Free Templates', () => {
  const renderer = new PromptRenderer();

  /**
   * **Validates: Requirements 13.4, 13.6**
   *
   * For any template string that contains no {{variable_name}} placeholders,
   * rendering it with the Prompt_Renderer (with an empty value map) SHALL return
   * text identical to the input template.
   */
  it('should return text identical to the input for templates with no variables', () => {
    fc.assert(
      fc.property(
        variableFreeLiteralArb,
        (template) => {
          // Precondition: template must not contain any {{word}} patterns
          fc.pre(!(/\{\{\w+\}\}/).test(template));

          const result = renderer.render(template, {});

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.text).toBe(template);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 9: Prompt Rendering Missing Variable Error', () => {
  const renderer = new PromptRenderer();

  /**
   * **Validates: Requirements 13.2**
   *
   * For any template string with at least one variable and an incomplete value map
   * (at least one variable missing), the Prompt_Renderer SHALL return a validation error
   * whose missingVariables list contains exactly the variable names not present in the value map.
   */
  it('should return exactly the missing variable names when the value map is incomplete', () => {
    fc.assert(
      fc.property(
        // Generate 2–10 unique variable names (need at least 2 so we can provide some and omit others)
        fc.uniqueArray(varNameArb, { minLength: 2, maxLength: 10 }),
        // Generate literal text segments
        fc.array(safeLiteralArb, { minLength: 2, maxLength: 11 }),
        // Generate values for the "provided" subset
        fc.array(safeValueArb, { minLength: 10, maxLength: 10 }),
        // Generate a split index to divide vars into provided vs missing
        fc.nat(),
        (varNames, literals, rawValues, splitSeed) => {
          // Split variables into provided and missing subsets
          // Ensure at least 1 provided and at least 1 missing
          const splitIndex = 1 + (splitSeed % (varNames.length - 1));
          const providedVars = varNames.slice(0, splitIndex);
          const missingVars = varNames.slice(splitIndex);

          // Build a template using all variables
          let template = '';
          for (let i = 0; i < varNames.length; i++) {
            template += (literals[i] ?? '') + `{{${varNames[i]}}}`;
          }
          template += literals[varNames.length] ?? '';

          // Build an incomplete value map (only provide values for the first subset)
          const values: Record<string, string> = {};
          for (let i = 0; i < providedVars.length; i++) {
            values[providedVars[i]] = rawValues[i] ?? '';
          }

          const result = renderer.render(template, values);

          // Should fail with missing variables
          expect(result.success).toBe(false);
          if (!result.success) {
            // The missingVariables list should contain exactly the missing variable names
            expect([...result.missingVariables].sort()).toEqual([...missingVars].sort());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
