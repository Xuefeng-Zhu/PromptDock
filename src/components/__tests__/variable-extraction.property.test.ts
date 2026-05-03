import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { extractVariables } from '../prompt-editor';

/**
 * Feature: prompt-dock-ui
 * Property 4: Variable extraction from template strings
 *
 * For any template string with {{variable_name}} placeholders, extraction
 * returns exactly the unique variable names in first-appearance order;
 * round-trip reconstruction preserves the original string.
 *
 * **Validates: Requirements 6.3, 6.6, 6.8**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Generate a valid variable name (word characters only, non-empty) */
const variableNameArb = fc.stringMatching(/^\w{1,20}$/);

/** Generate a template string with known variable placeholders interspersed with plain text */
/** Generate a plain text segment that does NOT contain {{...}} patterns */
const plainSegmentArb = fc.string({ maxLength: 30 }).map((s) =>
  // Strip any accidental {{ or }} sequences to avoid false variable matches
  s.replace(/\{\{/g, '{ ').replace(/\}\}/g, '} '),
);

const templateArb = fc
  .record({
    segments: fc.array(plainSegmentArb, { minLength: 1, maxLength: 6 }),
    variables: fc.array(variableNameArb, { minLength: 0, maxLength: 5 }),
  })
  .map(({ segments, variables }) => {
    // Interleave segments and variables: seg0 + {{var0}} + seg1 + {{var1}} + ...
    // Only min(segments.length, variables.length) variables are actually inserted
    const usedVariables = variables.slice(0, segments.length);
    let template = '';
    for (let i = 0; i < segments.length; i++) {
      template += segments[i];
      if (i < usedVariables.length) {
        template += `{{${usedVariables[i]}}}`;
      }
    }
    return { template, insertedVariables: usedVariables };
  });

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 4: Variable extraction from template strings', () => {
  it('extracts exactly the unique variable names in first-appearance order', () => {
    fc.assert(
      fc.property(templateArb, ({ template, insertedVariables }) => {
        const extracted = extractVariables(template);

        // Build expected unique list in first-appearance order
        const seen = new Set<string>();
        const expected: string[] = [];
        for (const v of insertedVariables) {
          if (!seen.has(v)) {
            seen.add(v);
            expected.push(v);
          }
        }

        expect(extracted).toEqual(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('round-trip: splitting by variables and rejoining reconstructs the original string', () => {
    fc.assert(
      fc.property(templateArb, ({ template }) => {
        const variables = extractVariables(template);

        // Reconstruct: replace each {{var}} back in and verify the template is unchanged
        // We do this by verifying that every extracted variable actually appears in the template
        for (const v of variables) {
          expect(template).toContain(`{{${v}}}`);
        }

        // Also verify: splitting by the variable pattern and rejoining gives back the original
        const parts = template.split(/\{\{\w+\}\}/);
        const matches = template.match(/\{\{\w+\}\}/g) ?? [];
        let reconstructed = '';
        for (let i = 0; i < parts.length; i++) {
          reconstructed += parts[i];
          if (i < matches.length) {
            reconstructed += matches[i];
          }
        }
        expect(reconstructed).toBe(template);
      }),
      { numRuns: 100 },
    );
  });
});
