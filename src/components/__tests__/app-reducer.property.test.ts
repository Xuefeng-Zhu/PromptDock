import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { appReducer } from '../AppShell';
import type { AppState, AppAction, Screen, FilterType } from '../AppShell';
import type { PromptRecipe, Folder } from '../../types/index';

/**
 * Feature: prompt-dock-ui
 * Property 1: Navigation reducer produces valid screen state
 *
 * For any valid AppState and any valid AppAction, the reducer produces a new
 * AppState where screen.name is one of onboarding, library, editor, settings;
 * selectedPromptId is null or a string; and all fields remain in valid domains.
 *
 * **Validates: Requirements 2.5, 12.1, 12.2, 12.4**
 */

// ─── Arbitraries ───────────────────────────────────────────────────────────────

const screenArb: fc.Arbitrary<Screen> = fc.oneof(
  fc.constant<Screen>({ name: 'onboarding' }),
  fc.constant<Screen>({ name: 'library' }),
  fc.record<Screen & { name: 'editor' }>({
    name: fc.constant('editor' as const),
    promptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  }),
  fc.constant<Screen>({ name: 'settings' }),
);

const filterTypeArb: fc.Arbitrary<FilterType> = fc.constantFrom('all', 'favorites', 'recent');

const promptRecipeArb: fc.Arbitrary<PromptRecipe> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  workspaceId: fc.string({ minLength: 1, maxLength: 10 }),
  title: fc.string({ maxLength: 50 }),
  description: fc.string({ maxLength: 100 }),
  body: fc.string({ maxLength: 200 }),
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

const folderArb: fc.Arbitrary<Folder> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const appStateArb: fc.Arbitrary<AppState> = fc.record({
  screen: screenArb,
  selectedPromptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  searchQuery: fc.string({ maxLength: 50 }),
  activeFilter: filterTypeArb,
  activeSidebarItem: fc.string({ minLength: 1, maxLength: 20 }),
  commandPaletteOpen: fc.boolean(),
  variableFillPromptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  prompts: fc.array(promptRecipeArb, { maxLength: 5 }),
  folders: fc.array(folderArb, { maxLength: 3 }),
});

const appActionArb: fc.Arbitrary<AppAction> = fc.oneof(
  fc.record({ type: fc.constant('NAVIGATE' as const), screen: screenArb }),
  fc.record({
    type: fc.constant('SELECT_PROMPT' as const),
    promptId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  }),
  fc.record({ type: fc.constant('SET_SEARCH' as const), query: fc.string({ maxLength: 50 }) }),
  fc.record({ type: fc.constant('SET_FILTER' as const), filter: filterTypeArb }),
  fc.record({
    type: fc.constant('TOGGLE_FAVORITE' as const),
    promptId: fc.string({ minLength: 1, maxLength: 20 }),
  }),
  fc.record({
    type: fc.constant('SET_SIDEBAR_ITEM' as const),
    item: fc.string({ minLength: 1, maxLength: 20 }),
  }),
  fc.constant<AppAction>({ type: 'OPEN_COMMAND_PALETTE' }),
  fc.constant<AppAction>({ type: 'CLOSE_COMMAND_PALETTE' }),
  fc.record({
    type: fc.constant('OPEN_VARIABLE_FILL' as const),
    promptId: fc.string({ minLength: 1, maxLength: 20 }),
  }),
  fc.constant<AppAction>({ type: 'CLOSE_VARIABLE_FILL' }),
);

// ─── Property Test ─────────────────────────────────────────────────────────────

const VALID_SCREEN_NAMES = ['onboarding', 'library', 'editor', 'settings'];
const VALID_FILTERS: FilterType[] = ['all', 'favorites', 'recent'];

describe('Property 1: Navigation reducer produces valid screen state', () => {
  it('should always produce a valid AppState for any valid state and action', () => {
    fc.assert(
      fc.property(appStateArb, appActionArb, (state, action) => {
        const next = appReducer(state, action);

        // screen.name is one of the valid screen names
        expect(VALID_SCREEN_NAMES).toContain(next.screen.name);

        // selectedPromptId is null or a string
        expect(
          next.selectedPromptId === null || typeof next.selectedPromptId === 'string',
        ).toBe(true);

        // searchQuery is a string
        expect(typeof next.searchQuery).toBe('string');

        // activeFilter is a valid FilterType
        expect(VALID_FILTERS).toContain(next.activeFilter);

        // activeSidebarItem is a string
        expect(typeof next.activeSidebarItem).toBe('string');

        // commandPaletteOpen is a boolean
        expect(typeof next.commandPaletteOpen).toBe('boolean');

        // variableFillPromptId is null or a string
        expect(
          next.variableFillPromptId === null || typeof next.variableFillPromptId === 'string',
        ).toBe(true);

        // prompts is an array
        expect(Array.isArray(next.prompts)).toBe(true);

        // folders is an array
        expect(Array.isArray(next.folders)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('NAVIGATE action sets the screen to the dispatched screen', () => {
    fc.assert(
      fc.property(appStateArb, screenArb, (state, screen) => {
        const next = appReducer(state, { type: 'NAVIGATE', screen });
        expect(next.screen).toEqual(screen);
      }),
      { numRuns: 100 },
    );
  });

  it('SELECT_PROMPT action updates selectedPromptId to the dispatched value', () => {
    fc.assert(
      fc.property(
        appStateArb,
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
        (state, promptId) => {
          const next = appReducer(state, { type: 'SELECT_PROMPT', promptId });
          expect(next.selectedPromptId).toBe(promptId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
