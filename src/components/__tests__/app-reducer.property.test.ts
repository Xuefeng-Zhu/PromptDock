import { describe, it } from 'vitest';

/**
 * Feature: prompt-dock-ui
 * Property 1: Navigation reducer produces valid screen state
 *
 * DEPRECATED: The appReducer has been removed from AppShell in favor of
 * PromptStore (Zustand) + local useState for navigation. These property tests
 * are no longer applicable. Navigation state is now managed via useState hooks
 * and CRUD operations delegate to PromptStore.
 *
 * See: AppShell.integration.test.tsx for the replacement integration tests.
 */

describe('Property 1: Navigation reducer produces valid screen state (DEPRECATED)', () => {
  it.skip('appReducer has been removed — navigation uses useState + PromptStore', () => {
    // No-op: reducer was removed in full-app-wiring Task 1
  });
});
