# PromptDock

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
| [Deferred Issues](docs/Issues.md) | Known implementation issues intentionally not fixed in the docs pass. |

## Key Features

- Prompt recipe library with create, edit, archive, duplicate, favorite, folder, and tag workflows.
- Template variables using `{{variable_name}}` placeholders.
- Variable fill modal with live preview before copy or paste.
- Global desktop hotkey (`CommandOrControl+Shift+P`) that toggles a compact quick launcher window.
- In-app command palette (`CommandOrControl+K`) for fast prompt lookup.
- Copy-to-clipboard and paste-into-active-app behavior in Tauri, with browser clipboard fallback where possible.
- Import/export of non-archived prompts as versioned JSON.
- Local-first storage by default, with optional Firebase Auth and Cloud Firestore sync.
- Sync status, offline-synced mode, and in-memory conflict review UI.
- Browser runtime support for development and static hosting experiments.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2, Rust 2021 |
| Frontend | React 18, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, CSS custom properties |
| State | Zustand 5 |
| Desktop persistence | `@tauri-apps/plugin-store` JSON store files |
| Browser persistence | `window.localStorage` via `BrowserStorageBackend` |
| Optional sync | Firebase Auth, Cloud Firestore |
| Native integration | Tauri invoke commands, global shortcut, clipboard manager, `enigo` for paste simulation |
| Tests | Vitest 3, Testing Library, jsdom, fast-check |
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
npx vitest run src/services/__tests__/
npx vitest run src/components/__tests__/AppShell.test.tsx
```

Current verification note: `npm run build`, `npm test`, and `cargo test` pass locally. Details are tracked in [Testing](docs/TESTING.md).

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
