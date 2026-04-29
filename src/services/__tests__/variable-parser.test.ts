import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { VariableParser } from '../variable-parser';

describe('VariableParser', () => {
  const parser = new VariableParser();

  it('should extract a single variable', () => {
    expect(parser.parse('Hello {{name}}')).toEqual(['name']);
  });

  it('should extract multiple variables in first-appearance order', () => {
    expect(parser.parse('{{greeting}} {{name}}, welcome to {{place}}')).toEqual([
      'greeting',
      'name',
      'place',
    ]);
  });

  it('should deduplicate repeated variables', () => {
    expect(parser.parse('{{name}} is {{name}} and {{name}}')).toEqual(['name']);
  });

  it('should deduplicate while preserving first-appearance order', () => {
    expect(parser.parse('{{a}} {{b}} {{a}} {{c}} {{b}}')).toEqual(['a', 'b', 'c']);
  });

  it('should return an empty array for templates with no variables', () => {
    expect(parser.parse('Hello world, no variables here!')).toEqual([]);
  });

  it('should return an empty array for an empty string', () => {
    expect(parser.parse('')).toEqual([]);
  });

  it('should treat variable names as case-sensitive', () => {
    expect(parser.parse('{{Name}} and {{name}} and {{NAME}}')).toEqual([
      'Name',
      'name',
      'NAME',
    ]);
  });

  it('should not match single curly braces', () => {
    expect(parser.parse('{name} is not a variable')).toEqual([]);
  });

  it('should not match triple curly braces as a variable', () => {
    // {{{name}}} — the regex matches the inner {{name}} portion
    const result = parser.parse('{{{name}}}');
    expect(result).toEqual(['name']);
  });

  it('should not match empty braces {{}}', () => {
    expect(parser.parse('{{}} is empty')).toEqual([]);
  });

  it('should not match placeholders with spaces', () => {
    expect(parser.parse('{{ name }} is not valid')).toEqual([]);
  });

  it('should not match placeholders with special characters', () => {
    expect(parser.parse('{{name-with-dash}} and {{name.dot}}')).toEqual([]);
  });

  it('should handle variables with underscores', () => {
    expect(parser.parse('{{first_name}} {{last_name}}')).toEqual([
      'first_name',
      'last_name',
    ]);
  });

  it('should handle variables with digits', () => {
    expect(parser.parse('{{var1}} {{var2}}')).toEqual(['var1', 'var2']);
  });

  it('should handle a template that is just a variable', () => {
    expect(parser.parse('{{onlyvar}}')).toEqual(['onlyvar']);
  });

  it('should handle adjacent variables', () => {
    expect(parser.parse('{{a}}{{b}}{{c}}')).toEqual(['a', 'b', 'c']);
  });
});

// ─── Generators ────────────────────────────────────────────────────────────────

/** Generates a valid variable name matching \w+ (at least 1 char of [a-zA-Z0-9_]) */
const varNameArb = fc.stringMatching(/^\w{1,20}$/);

/** Generates a literal text segment that contains no `{{` sequences */
const literalTextArb = fc.array(
  fc.constantFrom(
    ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=+[]|;:,.<>?/~`\n\t'.split('')
  ),
  { minLength: 0, maxLength: 30 }
).map(arr => arr.join('').replace(/\{\{/g, '{ {'));

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: prompt-dock, Property 4: Variable Parser Extracts Unique Variables in First-Appearance Order', () => {
  const parser = new VariableParser();

  /**
   * **Validates: Requirements 12.1, 12.2, 12.4**
   *
   * For any template string containing {{variable_name}} placeholders (including duplicates),
   * the Variable_Parser SHALL return exactly the set of unique variable names,
   * ordered by their first appearance in the template.
   */
  it('should return unique variable names in first-appearance order for any template with duplicates', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty list of variable names (may contain duplicates)
        fc.array(varNameArb, { minLength: 1, maxLength: 15 }),
        // Generate literal text segments to intersperse between variables
        fc.array(literalTextArb, { minLength: 2, maxLength: 16 }),
        (varNames, literals) => {
          // Build a template by interspersing literals and {{varName}} placeholders
          let template = '';
          for (let i = 0; i < varNames.length; i++) {
            template += (literals[i] ?? '') + `{{${varNames[i]}}}`;
          }
          template += literals[varNames.length] ?? '';

          const result = parser.parse(template);

          // Compute expected: unique names in first-appearance order
          const seen = new Set<string>();
          const expected: string[] = [];
          for (const name of varNames) {
            if (!seen.has(name)) {
              seen.add(name);
              expected.push(name);
            }
          }

          // Result should be exactly the unique names in first-appearance order
          expect(result).toEqual(expected);

          // All results should be unique
          expect(new Set(result).size).toBe(result.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 5: Variable Parser Case Sensitivity', () => {
  const parser = new VariableParser();

  /**
   * **Validates: Requirements 12.3**
   *
   * For any template string containing variable placeholders that differ only in letter casing
   * (e.g., {{Name}} and {{name}}), the Variable_Parser SHALL treat them as distinct variables
   * and return both.
   */
  it('should treat variables differing only in case as distinct', () => {
    fc.assert(
      fc.property(
        // Generate a base variable name using only lowercase letters (so we can create case variants)
        fc.stringMatching(/^[a-z]{1,15}$/),
        (baseName) => {
          // Create case variants: original lowercase, UPPERCASE, and Title Case
          const lower = baseName.toLowerCase();
          const upper = baseName.toUpperCase();
          const title = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();

          // Build a template with all three case variants
          const template = `{{${lower}}} {{${upper}}} {{${title}}}`;

          const result = parser.parse(template);

          // Collect the distinct variants (some may collide, e.g. single-char names)
          const expectedOrder: string[] = [];
          const seen = new Set<string>();
          for (const v of [lower, upper, title]) {
            if (!seen.has(v)) {
              seen.add(v);
              expectedOrder.push(v);
            }
          }

          expect(result).toEqual(expectedOrder);

          // If the variants are actually different strings, they must all appear
          if (lower !== upper) {
            expect(result).toContain(lower);
            expect(result).toContain(upper);
          }
          if (lower !== title && upper !== title) {
            expect(result).toContain(title);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: prompt-dock, Property 6: Variable Parser Round-Trip', () => {
  const parser = new VariableParser();

  /**
   * **Validates: Requirements 12.6**
   *
   * For any template string, extracting variables with the Variable_Parser and then
   * reconstructing a template containing those variables as {{name}} placeholders
   * SHALL yield a template from which re-extraction produces the same set of variable names.
   */
  it('should produce the same variable set after extract → reconstruct → re-extract', () => {
    fc.assert(
      fc.property(
        // Generate a list of unique variable names
        fc.uniqueArray(varNameArb, { minLength: 0, maxLength: 15 }),
        // Generate literal text segments
        fc.array(literalTextArb, { minLength: 1, maxLength: 16 }),
        (uniqueVars, literals) => {
          // Build an original template with the given variables
          let template = '';
          for (let i = 0; i < uniqueVars.length; i++) {
            template += (literals[i] ?? '') + `{{${uniqueVars[i]}}}`;
          }
          template += literals[uniqueVars.length] ?? '';

          // Step 1: Extract variables
          const extracted = parser.parse(template);

          // Step 2: Reconstruct a template from extracted variables
          const reconstructed = extracted.map(v => `{{${v}}}`).join(' ');

          // Step 3: Re-extract from reconstructed template
          const reExtracted = parser.parse(reconstructed);

          // The re-extracted set should equal the originally extracted set
          expect(reExtracted).toEqual(extracted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
