# Development

This guide is for contributors working on PromptDock locally.

## First-Time Setup

```bash
npm install
cp .env.example .env.local
```

Leave the Firebase values empty for local-only work. Fill them only when testing sync.

## Daily Workflow

Run the browser-only app:

```bash
npm run dev
```

Run the full Tauri desktop app:

```bash
npm run tauri dev
```

Run tests:

```bash
npm test
```

Run the production frontend build:

```bash
npm run build
```

Optional Firebase emulator workflow:

```bash
firebase emulators:start
```

Then set this in `.env.local`:

```dotenv
VITE_USE_EMULATOR=true
```

## Runtime Notes

- Vite uses port `1420` with `strictPort: true`.
- The browser runtime uses `BrowserStorageBackend` and localStorage keys prefixed with `promptdock:`.
- The Tauri runtime uses `LocalStorageBackend` and Tauri Store JSON files: `prompts.json`, `folders.json`, `settings.json`, and `workspace.json`.
- The quick launcher is a separate Tauri window. Browser-only development cannot exercise the real global hotkey or always-on-top window behavior.

## Coding Conventions

| Convention | Details |
|---|---|
| TypeScript | `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` are enabled in `tsconfig.json`. |
| Components | React function components with explicit prop interfaces. |
| State | Use Zustand stores; initialize production singletons in app bootstrap and factories in tests. |
| Persistence | Add persistence through repository interfaces, not direct component storage calls. |
| Firebase | Keep Firebase imports dynamic inside async paths. |
| Tauri | Wrap desktop-only `invoke()` calls in graceful fallback behavior where browser runtime matters. |
| Styling | Use Tailwind classes plus CSS variables from `src/styles.css`. |
| Icons | Prefer `lucide-react`. |
| Tests | Co-locate tests in `__tests__/` directories. Use `.property.test.ts` for fast-check invariants and `.integration.test.tsx` for cross-module UI flows. |

Use `npm run lint` for static TypeScript/React guardrails, `npm run build` for TypeScript validation and production bundling, and `npm test` for behavioral coverage.

## Branching and PR Expectations

Use `develop` as the integration branch for day-to-day work. Open regular
feature, fix, and documentation pull requests against `develop`; keep `main`
release-only and merge `develop` into `main` when cutting a release.

The repository CI workflow runs lint, frontend build, frontend tests, and Rust tests on pull requests and pushes to `develop` or `main`. Contributors should run the same verification locally before opening a PR when practical.

Use Conventional Commit-style titles for commit messages and PR titles when it
fits the change, such as `feat: add prompt folders`, `fix: preserve clipboard
fallback`, `docs: clarify release flow`, or `chore: update dependencies`.
Release notes are generated from merged PRs using `.github/release.yml`.

Recommended PR checklist:

- Explain the user-facing change and affected runtime: browser, Tauri, or sync.
- Add or update tests close to the changed module.
- Run targeted tests for the changed area.
- Run `npm run lint`, `npm test`, and `npm run build`, or explicitly call out known failures.
- For UI changes, include screenshots or a short screen recording.
- For Tauri changes, smoke-test `npm run tauri dev`.
- For sync changes, test against Firebase emulators when possible.

Useful PR labels:

- `type:feature`, `type:fix`, `type:docs`, `type:chore`
- `area:browser`, `area:tauri`, `area:sync`, `area:docs`
- `risk:release`, `risk:security`, `dependencies`, `breaking-change`

Suggested branch names:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

## How to Add a Feature

1. Identify the layer that owns the behavior.
   - UI-only: component or screen.
   - Local data: repository and store.
   - Business rule: service.
   - Native capability: Tauri command plus TypeScript utility wrapper.
   - Sync data: Firestore backend, rules, indexes, and sync service.
2. Extend shared types in `src/types/index.ts` only when the domain model changes.
3. Add or update repository interfaces before wiring a new persistence operation.
4. Add store actions for UI-facing mutations.
5. Keep components thin: call store actions or services instead of embedding data access.
6. Add focused tests:
   - Unit tests for pure services.
   - Store tests for state transitions.
   - Component tests for rendering and user events.
   - Integration tests for cross-store or sync wiring.
   - Property tests for invariants.
7. Update docs when setup, runtime behavior, APIs, or workflows change.

## Common Feature Examples

### Add a New Prompt Field

Touch points usually include:

- `src/types/index.ts`
- `src/components/PromptEditor.tsx`
- `src/components/PromptCard.tsx` or `PromptInspector.tsx`
- `src/repositories/local-storage-backend.ts`
- `src/repositories/browser-storage-backend.ts`
- `src/repositories/firestore-backend.ts`
- `src/services/import-export.ts`
- Related tests in `src/**/__tests__/`

Also check Firestore rules/indexes if the new field is queried or security-sensitive.

### Add a New Setting

Touch points usually include:

- `UserSettings` in `src/types/index.ts`
- defaults in `src/stores/settings-store.ts`
- defaults in storage backends and `src/repositories/settings-repository.ts`
- UI in `src/components/SettingsScreen.tsx`
- settings store/repository/component tests

### Add a Native Command

1. Implement the command in `src-tauri/src/commands.rs`.
2. Add it to `tauri::generate_handler!` in `src-tauri/src/lib.rs`.
3. Add permissions in `src-tauri/tauri.conf.json` if a plugin permission is needed.
4. Add a TypeScript wrapper in `src/utils/`.
5. Make browser behavior explicit: fallback, no-op, or surfaced error.

## Debugging Tips

| Problem | First checks |
|---|---|
| Browser app shows no saved prompts | Inspect localStorage keys `promptdock:prompts`, `promptdock:settings`, and onboarding key `promptdock_onboarding_complete`. |
| Tauri app cannot read saved data | Check Tauri Store files and console errors from `LocalStorageBackend` recovery. |
| Hotkey does not open launcher | Verify you are in Tauri runtime, not browser runtime. Check OS shortcut conflicts. |
| Clipboard works but paste does not | Paste simulation is desktop-only and may need OS permissions. The fallback leaves text on the clipboard. |
| Firebase sync fails immediately | Confirm Firebase env vars and emulator settings. See [Configuration](CONFIGURATION.md). |
| Firestore returns `permission-denied` | Deploy the latest `firestore.rules`, then check that `/workspaces/{uid}/members/{uid}` exists for the signed-in user. |
| UI test cannot find text | Check whether onboarding localStorage state or store singleton initialization is required. |
