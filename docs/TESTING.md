# Testing

PromptDock uses Vitest for TypeScript tests, Testing Library for React component interaction, jsdom for component environments, and fast-check for property-based tests.

## Test Strategy

| Test type | Location | Purpose |
|---|---|---|
| Unit tests | `src/services/__tests__/`, `src/repositories/__tests__/`, `src/stores/__tests__/`, `src/utils/__tests__/` | Validate pure business logic, data access behavior, state actions, and utility fallbacks. |
| Component tests | `src/components/__tests__/`, `src/components/ui/__tests__/`, `src/screens/__tests__/` | Validate rendering, accessibility roles, keyboard behavior, and user events. |
| Integration tests | `*.integration.test.tsx` | Validate cross-module flows such as sync wiring, folder/tag behavior, and conflict UI. |
| Property tests | `*.property.test.ts` | Validate invariants over generated data. |
| Setup sanity tests | `src/setup.test.ts` | Confirms Vitest and fast-check are operational. |

The default Vitest environment is `node`. Component tests that need a DOM use per-file `// @vitest-environment jsdom` directives.

## Commands

```bash
npm run lint
npm run build
npm test
npm run test:watch
npx vitest run src/services/__tests__/
npx vitest run src/components/__tests__/AppShell.test.tsx
npx vitest run --coverage
cargo test --manifest-path src-tauri/Cargo.toml
```

`npm run build` is also an important verification command because it runs `tsc` before Vite builds the frontend.

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
cargo test --manifest-path src-tauri/Cargo.toml
```

Result:

- ESLint passed.
- Frontend production build passed.
- 78 Vitest files discovered.
- 78 passed.
- 0 failed.
- 0 skipped.
- 773 tests total.
- 773 passed.
- 0 failed.
- 0 skipped.
- Rust/Tauri compiled with 4 Rust unit tests currently present.

## Recommended Missing Tests

- Higher-level Tauri integration tests for clipboard commands, real hotkey registration, window toggling, and paste simulation.
- End-to-end tests for the real Tauri desktop app, including quick launcher focus, hide/show behavior, and paste into an active target.
- Firebase emulator integration tests that create a user, bootstrap a workspace, write prompts, and verify rules.
- Firestore security rules tests.
- Tests for migration from local prompts to synced prompts, including workspace ID consistency.
- Tests for folder persistence through a future repository/store once folder storage is moved out of the localStorage utility.
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
