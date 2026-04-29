import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { VariableParser } from '../variable-parser';

const parser = new VariableParser();

describe('VariableParser', () => {
  it('extracts a single variable', () => {
    expect(parser.parse('Hello {{name}}')).toEqual(['name']);
  });

  it('extracts multiple variables', () => {
    expect(parser.parse('{{a}} and {{b}}')).toEqual(['a', 'b']);
  });

  it('deduplicates variables', () => {
    expect(parser.parse('{{x}} {{x}}')).toEqual(['x']);
  });

  it('returns empty for no variables', () => {
    expect(parser.parse('no variables here')).toEqual([]);
  });

  it('handles malformed placeholders', () => {
    expect(parser.parse('{{}} {{')).toEqual([]);
  });

  it('treats names as case-sensitive', () => {
    expect(parser.parse('{{Name}} {{name}}')).toEqual(['Name', 'name']);
  });

  // Property 4: Unique variables in first-appearance order
  it('P4: extracts unique variables in first-appearance order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,10}$/), { minLength: 1, maxLength: 10 }),
        (vars) => {
          const template = vars.map((v) => `{{${v}}}`).join(' ');
          const result = parser.parse(template);
          const unique = [...new Set(vars)];
          expect(result).toEqual(unique);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Case sensitivity
  it('P5: treats differently-cased names as distinct', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9]{0,5}$/),
        (name) => {
          const upper = name.charAt(0).toUpperCase() + name.slice(1);
          if (name === upper) return; // skip if same
          const template = `{{${name}}} {{${upper}}}`;
          const result = parser.parse(template);
          expect(result).toContain(name);
          expect(result).toContain(upper);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Round-trip
  it('P6: round-trip preserves variable set', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,10}$/), { minLength: 1, maxLength: 5 }),
        (vars) => {
          const template = vars.map((v) => `{{${v}}}`).join(' ');
          const extracted = parser.parse(template);
          const rebuilt = extracted.map((v) => `{{${v}}}`).join(' ');
          const reExtracted = parser.parse(rebuilt);
          expect(reExtracted).toEqual(extracted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
