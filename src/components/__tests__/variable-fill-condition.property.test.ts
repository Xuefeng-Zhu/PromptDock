import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { extractVariables } from '../prompt-editor';

/**
 * Feature: prompt-dock-ui
 * Property 8: Variable fill modal appears if and only if prompt has variables
 *
 * For any PromptRecipe, the variable fill modal should display iff the body
 * contains at least one {{variable_name}} placeholder. We verify this by
 * checking that extractVariables returns a non-empty array iff the body
 * contains {{variable_name}} patterns.
 *
 * **Validates: Requirements 7.5**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

/** Generate a valid variable name (word characters only, non-empty) */
const variableNameArb = fc.stringMatching(/^\w{1,20}$/);

/** Generate a plain text segment that does NOT contain {{...}} patterns */
const plainTextArb = fc.string({ maxLength: 50 }).map((s) =>
  s.replace(/\{\{/g, '{ ').replace(/\}\}/g, '} '),
);

/** Generate a body string that definitely contains at least one variable */
const bodyWithVariablesArb = fc
  .record({
    prefix: plainTextArb,
    variables: fc.array(variableNameArb, { minLength: 1, maxLength: 5 }),
    segments: fc.array(plainTextArb, { minLength: 1, maxLength: 5 }),
  })
  .map(({ prefix, variables, segments }) => {
    let body = prefix;
    for (let i = 0; i < variables.length; i++) {
      body += `{{${variables[i]}}}`;
      if (i < segments.length) {
        body += segments[i];
      }
    }
    return body;
  });

/** Generate a body string that definitely contains NO variables */
const bodyWithoutVariablesArb = plainTextArb;

/** Generate a random PromptRecipe-like object with a given body */
function promptWithBody(bodyArb: fc.Arbitrary<string>) {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    workspaceId: fc.string({ minLength: 1, maxLength: 10 }),
    title: fc.string({ maxLength: 50 }),
    description: fc.string({ maxLength: 100 }),
    body: bodyArb,
    tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 5 }),
    folderId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
    favorite: fc.boolean(),
    archived: fc.boolean(),
    archivedAt: fc.option(fc.date(), { nil: null }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    lastUsedAt: fc.option(fc.date(), { nil: null }),
    createdBy: fc.string({ minLength: 1, maxLength: 10 }),
    version: fc.nat({ max: 100 }),
  });
}

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property 8: Variable fill modal appears iff prompt has variables', () => {
  it('extractVariables returns non-empty array when body contains {{variable_name}} patterns', () => {
    fc.assert(
      fc.property(promptWithBody(bodyWithVariablesArb), (prompt) => {
        const variables = extractVariables(prompt.body);
        expect(variables.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('extractVariables returns empty array when body contains no {{variable_name}} patterns', () => {
    fc.assert(
      fc.property(promptWithBody(bodyWithoutVariablesArb), (prompt) => {
        const variables = extractVariables(prompt.body);
        expect(variables.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('modal condition: hasVariables is true iff extractVariables returns non-empty', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          promptWithBody(bodyWithVariablesArb),
          promptWithBody(bodyWithoutVariablesArb),
        ),
        (prompt) => {
          const variables = extractVariables(prompt.body);
          const hasVariablePattern = /\{\{\w+\}\}/.test(prompt.body);

          // extractVariables returns non-empty iff body has {{variable_name}} patterns
          expect(variables.length > 0).toBe(hasVariablePattern);
        },
      ),
      { numRuns: 100 },
    );
  });
});
