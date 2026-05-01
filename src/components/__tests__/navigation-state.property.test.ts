import { describe, it } from 'vitest';

/**
 * Feature: prompt-dock-ui
 * Property 6: State preservation across editor round-trip navigation
 *
 * DEPRECATED: The appReducer has been removed from AppShell in favor of
 * PromptStore (Zustand) + local useState for navigation. Navigation state
 * (searchQuery, activeFilter) is now preserved naturally via useState hooks
 * that persist across screen changes.
 *
 * See: AppShell.integration.test.tsx for the replacement integration tests.
 */

describe('Property 6: State preservation across editor round-trip navigation (DEPRECATED)', () => {
  it.skip('appReducer has been removed — navigation uses useState + PromptStore', () => {
    // No-op: reducer was removed in full-app-wiring Task 1
  });
});
