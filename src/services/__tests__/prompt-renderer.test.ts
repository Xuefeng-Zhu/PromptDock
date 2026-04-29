import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PromptRenderer } from '../prompt-renderer';
import { VariableParser } from '../variable-parser';

const renderer = new PromptRenderer();
const parser = new VariableParser();

describe('PromptRenderer', () => {
  it('substitutes a single variable', () => {
    const result = renderer.render('Hello {{name}}', { name: 'World' });
    expect(result).toEqual({ success: true, text: 'Hello World' });
  });

  it('substitutes multiple variables', () => {
    const result = renderer.render('{{a}} and {{b}}', { a: '1', b: '2' });
    expect(result).toEqual({ success: true, text: '1 and 2' });
  });

  it('returns missing variables error', () => {
    const result = renderer.render('{{a}} {{b}}', { a: '1' });
    expect(result).toEqual({ success: false, missingVariables: ['b'] });
  });

  it('returns template unchanged when no variables', () => {
    const result = renderer.render('plain text', {});
    expect(result).toEqual({ success: true, text: 'plain text' });
  });

  it('replaces multiple occurrences', () => {
    const result = renderer.render('{{x}} and {{x}}', { x: 'val' });
    expect(result).toEqual({ success: true, text: 'val and val' });
  });

  // Property 7: No placeholder remains after complete render
  it('P7: no placeholders remain after complete render', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,10}$/), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (vars, filler) => {
          const unique = [...new Set(vars)];
          const template = unique.map((v) => `text {{${v}}} more`).join(' ');
          const values: Record<string, string> = {};
          for (const v of unique) values[v] = filler;
          const result = renderer.render(template, values);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.text).not.toMatch(/\{\{[^}]+\}\}/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: Identity for variable-free templates
  it('P8: identity for variable-free templates', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('{{') || !s.includes('}}')),
        (template) => {
          const vars = parser.parse(template);
          if (vars.length === 0) {
            const result = renderer.render(template, {});
            expect(result).toEqual({ success: true, text: template });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 9: Missing variable error
  it('P9: returns exactly the missing variables', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,10}$/), { minLength: 2, maxLength: 5 }),
        (vars) => {
          const unique = [...new Set(vars)];
          if (unique.length < 2) return;
          const template = unique.map((v) => `{{${v}}}`).join(' ');
          // Provide values for all but the last
          const values: Record<string, string> = {};
          for (let i = 0; i < unique.length - 1; i++) values[unique[i]] = 'val';
          const result = renderer.render(template, values);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.missingVariables).toEqual([unique[unique.length - 1]]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
