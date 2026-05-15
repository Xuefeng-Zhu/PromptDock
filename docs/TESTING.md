# Testing

PromptDock uses Vitest for TypeScript tests, Testing Library for React component interaction, jsdom for component environments, and fast-check for property-based tests.

## Test Strategy

| Test type | Location | Purpose |
|---|---|---|
| Unit tests | `src/services/__tests__/`, `src/repositories/__tests__/`, `src/stores/__tests__/`, `src/utils/__tests__/` | Validate pure business logic, data access behavior, state actions, and utility fallbacks. |
| Component tests | `src/components/__tests__/`, `src/components/ui/__tests__/`, `src/screens/__tests__/` | Validate rendering, accessibility roles, keyboard behavior, and user events. |
| Integration tests | `*.integration.test.tsx` | Validate cross-module flows such as sync wiring, folder/tag behavior, and conflict UI. |
| Property tests | `*.property.test.ts` | Validate invariants over generated data. |
| Browser e2e tests | `e2e/*.spec.ts` | Validate real browser workflows against the Vite app and browser localStorage runtime. |
| Setup sanity tests | `src/setup.test.ts` | Confirms Vitest and fast-check are operational. |

The default Vitest environment is `node`. Component tests that need a DOM use per-file `// @vitest-environment jsdom` directives.
Playwright e2e tests currently run only in Chromium to keep local and CI runtime modest.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:debug
npm run test:e2e:ui
npm run test:watch
npx vitest run src/services/__tests__/
npx vitest run src/components/__tests__/AppShell.test.tsx
npx vitest run --coverage
cargo test --manifest-path src-tauri/Cargo.toml
```

`npm run build` is also an important verification command because it runs `tsc` before Vite builds the frontend.

## Browser E2E Coverage Matrix

The Playwright suite is organized by user journey rather than priority-coded
filenames. Each test runs against the Vite/browser runtime with real
`localStorage` persistence and deterministic seed data; no Firebase project or
external service is required.

| Flow | User goal | Setup/data required | Test cases | Expected assertions | Priority | Data mode |
|---|---|---|---|---|---|---|
| App load and onboarding | Reach a usable local library on first launch. | Fresh browser context, seeded default prompts. | Load `/`, start locally, reload. | Onboarding appears once, seeded prompts render, onboarding is skipped after reload. | P0 | Local fixture + real `localStorage` |
| Account entry | Explore sync entry points without committing to cloud auth. | Fresh context; Firebase may or may not be configured locally. | Open sign-in branch, cancel, open account popover. | Auth fields and actions are visible, cancel returns to onboarding, local mode remains available. | P0 | Local fixture |
| Prompt authoring | Create durable prompt recipes with variables. | Seeded library. | Create prompt, inspect variables, reload, fill preview values. | Prompt appears after save/reload, onboarding stays skipped, rendered preview updates with values. | P0 | Real `localStorage` |
| Prompt validation | Prevent invalid prompt saves. | New prompt draft. | Empty save, missing body, invalid dropdown default, corrected save. | Required-field and dropdown errors appear, corrected prompt saves, default value renders. | P0 | Local fixture |
| Prompt lifecycle | Manage existing prompts safely. | Seeded plus test prompt. | Favorite, edit, archive, restore, cancel delete, confirm delete. | Filter membership changes, edit persists, archive hides from library, restore returns, delete removes. | P0 | Local fixture + real `localStorage` |
| Dirty editor guard | Avoid accidental data loss. | Unsaved editor draft. | Attempt sidebar navigation, then cancel intentionally. | Toast blocks navigation while dirty; explicit cancel returns to library. | P0 | Local fixture |
| Prompt execution | Find a prompt and copy rendered output. | Seeded prompt with variables; clipboard permission. | Open command palette, empty search, Escape close, variable fill, copy. | Empty state appears, modal renders variables, clipboard contains rendered prompt. | P0 | Browser clipboard |
| Library organization | Keep a growing library findable. | Created prompt with folder and tag. | Folder/tag sidebar filters, search, sort, list view, filter popover. | Matching prompt remains visible, unrelated prompts are excluded, selected sort/view state is shown. | P1 | Local fixture |
| Empty states | Recover from no-result searches. | Seeded library. | Search impossible query, clear search. | No-results message appears, seeded prompts return after clearing. | P1 | Local fixture |
| Folder cleanup | Delete organization without deleting prompts. | Created prompt assigned to a folder. | Delete folder with prompt inside. | Confirmation explains move to No folder, toast reports move, prompt remains in library. | P1 | Local fixture |
| Settings preferences | Persist browser-safe preferences. | Local settings store. | Switch dark mode, inspect default behavior, reload. | `html.dark` persists, browser hides native paste action, dark radio remains checked. | P1 | Real `localStorage` |
| Import/export | Move prompt data safely. | File chooser/download fixtures. | Export, invalid JSON import, valid JSON import. | Download filename is stable, validation errors show, imported prompt appears. | P1 | Local file fixtures |
| Duplicate import handling | Resolve imported duplicates deliberately. | Seeded prompt and duplicate JSON fixture. | Skip duplicates, then overwrite duplicate. | Skip leaves data unchanged, overwrite updates existing prompt body/tags. | P1 | Local file fixtures |
| Responsive navigation | Navigate on narrow screens. | Mobile viewport. | Open drawer, route to settings, go back, close with Escape. | Drawer appears, settings route works, library returns, Escape closes drawer. | P1 | Local fixture |
| Native desktop behavior | Verify global hotkey, separate launcher window, Tauri Store files, and paste simulation. | Real Tauri app and OS target app. | Planned separately. | Not covered by browser E2E. | P2 | Native/Tauri follow-up |

## Important Covered Areas

- Variable parsing and prompt rendering.
- Search ranking and archived prompt filtering.
- Import/export JSON schema validation and duplicate detection.
- Clipboard fallback behavior when Tauri is unavailable.
- Sidebar counts for filters, folders, and tags.
- Prompt repository CRUD, soft delete, restore, duplicate, favorite.
- Local Tauri Store serialization/deserialization and corruption recovery paths.
- Settings repository/store behavior.
- App mode state machine.
- Browser onboarding/account entry, prompt authoring validation, prompt lifecycle, library organization, command palette variable fill/copy, settings, import/export duplicate handling, responsive navigation, and localStorage persistence after reload.
- Firebase converter round trips.
- Sync service transition, snapshot, offline, and conflict wiring behavior.
- Prompt editor, library, command palette, quick launcher, settings, and conflict UI behavior.

## Property-Based Invariants

Current property tests cover, among other things:

- Clipboard fallback preserves arbitrary strings.
- Variable extraction returns unique placeholders in first-appearance order.
- Sidebar total/favorites/recent/archived counts match prompt data.
- Sidebar folder counts match grouped non-archived prompts.
- Sidebar tag counts match tag occurrences across non-archived prompts.
- Favorites filter returns only favorited prompts.
- Search results include matching prompts and exclude nonmatches.
- Text word/character count helpers behave over generated input.
- Arrow navigation clamps highlighted indices.

## Current Verification Status

Last checked locally:

```bash
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:e2e
cargo test --manifest-path src-tauri/Cargo.toml
```

Result:

- ESLint passed.
- TypeScript typecheck passed.
- Frontend production build passed.
- 17 browser e2e tests passed in Chromium.
- 94 Vitest files discovered.
- 93 passed.
- 0 failed.
- 1 skipped.
- 953 tests total.
- 945 passed.
- 0 failed.
- 8 skipped.
- Rust/Tauri compiled with 5 Rust unit tests currently present.

## Recommended Missing Tests

- Higher-level Tauri integration tests for clipboard commands, real hotkey registration, window toggling, and paste simulation.
- End-to-end tests for the real Tauri desktop app, including quick launcher focus, hide/show behavior, and paste into an active target. Browser e2e coverage does not exercise native hotkeys, Tauri Store files, separate launcher windows, or paste simulation.
- Firebase emulator integration tests that create a user, bootstrap a workspace, write prompts, and verify rules.
- Firestore security rules tests.
- Tests for migration from local prompts to synced prompts, including workspace ID consistency.
- More coverage for local and synced folder edge cases, especially duplicate handling, workspace transitions, and migration behavior.
- Tests for Tauri Store file corruption recovery with realistic malformed store files.
- Accessibility-focused tests for dialog focus trapping and restore behavior.
- Visual or screenshot regression tests for the dense desktop UI.

## Guidance for New Tests

- Prefer testing public behavior over implementation details.
- Use store factories rather than production singleton hooks when testing stores.
- Mock Tauri `invoke()` at module boundaries in browser/jsdom tests.
- Keep fast-check generators realistic enough to preserve domain invariants.
- If a property test trims or normalizes input in production code, mirror that normalization in the property expectation.
- Add integration tests when a change crosses UI, store, and repository boundaries.
