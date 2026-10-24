# PromptDock

**[Open the live web app](https://promptdock-95e31.web.app)** — no account required; start locally.

[Marketing and desktop downloads](https://xuefeng-zhu.github.io/PromptDock) is the GitHub Pages download page, not the live web app or TestSprite test target.

PromptDock is a local-first prompt recipe manager for people who reuse AI prompts throughout their day. It runs as a Tauri desktop app with a global quick launcher, and it also runs in a regular browser during development by falling back to `window.localStorage`.

Users create reusable prompt templates, organize them with folders/tags/favorites, fill `{{variable}}` placeholders, then copy or paste the rendered prompt into another app.

## Documentation

| Document | Purpose |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, module boundaries, and design decisions. |
| [Sync](docs/SYNC.md) | Local-to-synced mode transition, Firestore migration, listeners, offline behavior, and caveats. |
| [Development](docs/DEVELOPMENT.md) | Local workflow, conventions, feature workflow, and debugging tips. |
| [Configuration](docs/CONFIGURATION.md) | Environment variables, config files, Firebase setup, and secrets handling. |
| [Testing](docs/TESTING.md) | Test strategy, commands, current verification status, and missing tests. |
| [API](docs/API.md) | Internal TypeScript interfaces, Tauri commands, Firestore collections, and import/export schema. |
| [Release](docs/RELEASE.md) | Release flow, browser/Tauri builds, Firebase deployment, CI/CD notes, and rollback strategy. |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common setup, runtime, sync, and build/test issues. |
| [Architecture Decision Records](docs/adr) | Durable engineering decisions and their consequences. |
| [Deferred Issues](docs/Issues.md) | Known deferred implementation and test-coverage follow-ups. |

## Key Features

- Prompt recipe library with create, edit, archive, duplicate, favorite, folder, and tag workflows.
- Template variables using `{{variable_name}}` placeholders, with optional text, textarea, or dropdown metadata.
- Variable fill modal with default values and live preview before copy or paste.
- Global desktop hotkey (`CommandOrControl+Shift+P`) that toggles a compact quick launcher window.
- In-app command palette (`CommandOrControl+K`) for fast prompt lookup.
- Copy-to-clipboard and paste-into-active-app behavior in Tauri, with browser clipboard fallback where possible.
- Fill a prompt editor draft from a single-prompt JSON snippet.
- Import/export of non-archived prompts as versioned JSON, including variable metadata and duplicate handling.
- Local-first storage by default, with optional Firebase Auth and Cloud Firestore sync.
- Synced workspaces with owner/editor/viewer roles, member invites, viewer domain access, workspace switching, and duplicate-to-workspace flows.
- Sync status, offline-synced mode, and in-memory conflict review UI.
- Browser runtime support for development and static hosting experiments.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2, Rust 2021 |
| Frontend | React 19.2.6, TypeScript 6.0.3, Vite 8.0.13 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, CSS custom properties |
| State | Zustand 5 |
| Desktop persistence | `@tauri-apps/plugin-store` JSON store files |
| Browser persistence | `window.localStorage` via `BrowserStorageBackend` |
| Optional sync | Firebase Auth, Cloud Firestore |
| Native integration | Tauri invoke commands, global shortcut, clipboard manager, `enigo` for paste simulation |
| Tests | Vitest 4.1.6, Testing Library, jsdom, fast-check, Playwright |
| Icons | `lucide-react` |

## Prerequisites

- Node.js 20.19 or newer. The checked-in `.nvmrc` uses Node 24.
- npm, using the committed `package-lock.json`.
- Rust stable and the Tauri 2 platform prerequisites for your OS.
- Optional: Firebase CLI for Auth/Firestore emulators and rules deployment.

The package metadata enforces the Node.js minimum through the `engines` field.

## Local Setup

```bash
git clone <repository-url>
cd PromptDock
npm install
cp .env.example .env.local
```

Local-only development does not require Firebase values. Leave the Firebase fields blank unless you are testing sync.

Start the browser-only app:

```bash
npm run dev
```

The Vite dev server uses `http://localhost:1420` and `strictPort: true`.

Start the full desktop app:

```bash
npm run tauri dev
```

This runs Vite first, then launches the Tauri shell with the main window and hidden quick-launcher window.

## Environment Variables

| Variable | Required | Default | Notes |
|---|---:|---|---|
| `VITE_FIREBASE_API_KEY` | Sync only | none | Firebase web API key. Embedded in the client bundle. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sync only | none | Firebase Auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | Sync only | none | Firebase project ID used by Auth and Firestore. |
| `VITE_FIREBASE_APP_ID` | Analytics only | none | Firebase web app ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics only | none | Google Analytics measurement ID for the Firebase web app. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | none | Optional Firebase web app config field. |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | none | Optional Firebase web app config field. |
| `VITE_FIREBASE_ANALYTICS_ENABLED` | No | `true` | Set to `false` to disable Analytics even when configured. Analytics is also disabled when `VITE_USE_EMULATOR=true`. |
| `VITE_USE_EMULATOR` | No | `false` | Set to `true` to connect Auth and Firestore to local emulators. |
| `VITE_EMULATOR_AUTH_HOST` | No | `http://localhost:9099` | Auth emulator URL. |
| `VITE_EMULATOR_FIRESTORE_HOST` | No | `localhost:8080` | Firestore emulator host and port. |

Firebase sync supports Email/Password and Google sign-in. Enable both providers in the Firebase Authentication console for production projects.

See [Configuration](docs/CONFIGURATION.md) for examples and config-file details.

## Common Commands

```bash
npm run dev          # Vite dev server, browser runtime
npm run tauri dev    # Tauri desktop dev app
npm run lint         # ESLint for TypeScript/React guardrails
npm run build        # TypeScript check plus Vite production build
npm run preview      # Preview the production frontend build
npm test             # Run Vitest once
npm run test:e2e     # Run browser E2E tests with Playwright Chromium
npm run test:e2e:tauri  # Run Tauri desktop E2E on Windows/Linux with tauri-driver
npm run test:e2e:ui  # Open the Playwright UI runner
npm run test:watch   # Run Vitest in watch mode
npm run tauri build  # Build platform-specific desktop bundles
```

Firebase emulator workflow:

```bash
firebase emulators:start
```

Then set `VITE_USE_EMULATOR=true` in `.env.local`.

## Testing

The suite includes service tests, repository tests, store tests, component tests, integration tests, and property-based tests.

```bash
npm test
npm run test:e2e
npm run test:e2e:tauri
npx vitest run src/services/__tests__/
npx vitest run src/components/__tests__/AppShell.test.tsx
```

The main verification suite covers linting, typecheck/build, Vitest, Playwright browser E2E, and Rust unit tests. Details are tracked in [Testing](docs/TESTING.md).

## Testing with TestSprite

The TestSprite 3.0 portal suite targets the [live web app](https://promptdock-95e31.web.app) in anonymous local mode. The [suite scope](docs/hackathon/TESTSPRITE_SCOPE.md) covers prompt create/edit/duplicate/favorite/archive/restore, folders and tags, search and the command palette, variable defaults/dropdowns/live preview, exact clipboard output, JSON import/export and duplicate handling, invalid input, reload persistence, long and special-character content, and mobile navigation. Firebase sync/workspace scenarios require dedicated test accounts and are optional.

The TestSprite GitHub App is connected to PromptDock. Its active pull-request trigger waits for the `firebase-hosting` deployment from eligible same-repository PRs into `develop`. The portal's **Merge gate / Blocking PRs** option is on. The [latest run on PR #202](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/620b8fd6-556b-40eb-b96d-bcee225d8515) executed 107 cases: **63 passed, 23 failed, 21 blocked**. The PR has a failing TestSprite status and remains unmerged. GitHub requires both Build and test from GitHub Actions and TestSprite V3 from TestSprite on develop. The submission is not yet complete. See [setup and triage](docs/hackathon/PORTAL_SETUP.md).

The production Hosting workflow runs on pushes to `main` or manual dispatch. Tested PR #202 commit `e6339b1` was manually deployed to production on October 22, 2026 with approval; neither `main` nor `develop` was moved for that deployment. The [PR preview workflow](.github/workflows/firebase-hosting-preview.yml) deploys seven-day previews and passed on [PR #201](https://github.com/Xuefeng-Zhu/PromptDock/pull/201); fork and Dependabot PRs do not deploy. **Frank selected the fixed production URL for the deadline:** TestSprite runs after the preview deployment event but tests production, not unmerged PR code. Firebase's unpredictable preview URL suffix does not fit the portal's supported URL placeholders. Dynamic preview targets remain future work.

All eight synthetic test fixtures are uploaded and Ready. The later keyboard-action rerun passed all three clearing-input cases (TEM-001, LIB-005, FAV-008). The latest individual-case totals are 86 passed, 5 failed and 16 blocked; the remaining work includes long-content and file-picker/download handling. The previous full PR run was not started because credits were insufficient. On October 23 the workspace showed 280.4 credits, clearing that blocker; runner file handling still needs validation before a full rerun. These individual-case results do not replace the failing full PR check.

Local checks supplement the portal suite: `npm run lint`, `npm run build`, `npm test`, and `npm run test:e2e`. TestSprite results must come from its own portal/GitHub App; local checks do not satisfy that requirement.

## Release

Frontend-only build:

```bash
npm run build
npm run preview
```

Tauri desktop build:

```bash
npm run tauri build
```

Tauri outputs platform bundles under `src-tauri/target/release/bundle/`.

Firebase rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

See [Release](docs/RELEASE.md) before publishing; desktop release builds run through `.github/workflows/release-macos.yml` and `.github/workflows/release-windows.yml`.

## Troubleshooting

- If `npm run dev` fails because port 1420 is busy, stop the other process first; the Vite config uses `strictPort`.
- If sync throws `Firebase configuration is missing`, either stay in local mode or fill the Firebase variables in `.env.local`.
- If Firestore returns `permission-denied`, deploy the latest `firestore.rules` and confirm the user has a `/workspaces/{uid}/members/{uid}` owner document.
- If the global hotkey does not work, check for OS-level shortcut conflicts and rerun the app through Tauri rather than the browser-only Vite runtime.
- If paste into the active app fails on macOS, check system privacy permissions for automation/accessibility-style input simulation.
- If paste into the active app fails on Windows, make sure the target app accepts Ctrl+V and that no security tool is blocking simulated keyboard input.
- If tests or builds fail, compare against the current verification status in [Testing](docs/TESTING.md) and the setup notes in [Troubleshooting](docs/TROUBLESHOOTING.md).

## License

PromptDock is licensed under the GNU Affero General Public License v3.0 only
(`AGPL-3.0-only`). See [LICENSE](LICENSE).
