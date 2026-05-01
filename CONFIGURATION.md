# Configuration

PromptDock has three configuration surfaces:

- Vite environment variables for optional Firebase sync.
- Tauri desktop configuration for windows, capabilities, plugins, and bundling.
- Firebase configuration for emulators, Firestore rules, and Firestore indexes.

## Environment Variables

Copy the example file for local development:

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Used by | Description |
|---|---:|---|---|---|
| `VITE_FIREBASE_API_KEY` | Sync only | none | `src/firebase/config.ts` | Firebase web API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sync only | none | `src/firebase/config.ts` | Firebase Auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | Sync only | none | `src/firebase/config.ts` | Firebase project ID. |
| `VITE_USE_EMULATOR` | No | `false` | `src/firebase/config.ts` | Set to `true` to connect Firebase SDKs to local emulators. |
| `VITE_EMULATOR_AUTH_HOST` | No | `http://localhost:9099` | `src/firebase/config.ts` | Auth emulator URL. |
| `VITE_EMULATOR_FIRESTORE_HOST` | No | `localhost:8080` | `src/firebase/config.ts` | Firestore emulator host and port. |

If required Firebase variables are missing, `getFirebaseApp()` throws. Local mode is still usable without these variables as long as the user does not start sync.

## Example Local Configuration

Local-only:

```dotenv
VITE_USE_EMULATOR=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_EMULATOR_AUTH_HOST=http://localhost:9099
VITE_EMULATOR_FIRESTORE_HOST=localhost:8080
```

Firebase emulator development:

```dotenv
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_EMULATOR_AUTH_HOST=http://localhost:9099
VITE_EMULATOR_FIRESTORE_HOST=localhost:8080
```

Assumption: The exact demo values do not matter for emulator-only work, but a Firebase app config object is still required by the SDK.

## Secrets Handling

- Do not commit `.env` or `.env.local`; both are ignored by `.gitignore`.
- Values prefixed with `VITE_` are embedded into the client bundle and must not contain private server secrets.
- Firebase web API keys are identifiers, not server secrets. Firestore security must come from `firestore.rules`.
- Keep production Firebase project configuration outside source control unless the project intentionally publishes it.

## Config Files

| File | Purpose |
|---|---|
| `package.json` | npm scripts, frontend dependencies, Tauri CLI version. |
| `package-lock.json` | Locked npm dependency graph. |
| `tsconfig.json` | Strict TypeScript config. |
| `vite.config.ts` | React/Tailwind Vite config, Tauri-oriented dev server on port 1420. |
| `vitest.config.ts` | Vitest include patterns, default `node` environment, V8 coverage config. |
| `src/setup.test.ts` | Basic Vitest and fast-check setup sanity tests. |
| `src-tauri/tauri.conf.json` | Product metadata, Tauri windows, security capabilities, bundle icons, dev/build hooks. |
| `src-tauri/Cargo.toml` | Rust crate metadata and native dependencies. |
| `firebase.json` | Firestore rules/index files and emulator ports. |
| `firestore.rules` | Firestore authorization model. |
| `firestore.indexes.json` | Composite indexes for prompt queries. |
| `.env.example` | Template for local environment variables. |
| `.gitignore` | Ignores dependencies, build output, Tauri target output, env files, IDE/OS files. |

## Tauri Configuration Highlights

`src-tauri/tauri.conf.json` defines:

- Product name: `PromptDock`
- Version: `0.1.0`
- Identifier: `com.promptdock.app`
- Dev URL: `http://localhost:1420`
- Frontend dist: `../dist`
- Main window: `main`, visible, resizable, 1024 x 700
- Quick launcher window: `quick-launcher`, hidden by default, always on top, undecorated, 680 x 480
- Capabilities for global shortcut, clipboard manager, store plugin, and core Tauri APIs

The Rust layer also registers a tray icon and default hotkey in `src-tauri/src/lib.rs`.

## Firebase Configuration

`firebase.json` configures:

| Emulator | Host | Port |
|---|---|---:|
| Auth | `127.0.0.1` | 9099 |
| Firestore | `127.0.0.1` | 8080 |
| Emulator UI | default host | 4000 |

`firestore.rules` expects authenticated users to access only their own user/settings documents and workspace resources where they have membership.

TODO: The app currently creates a user document during signup, but the workspace and membership bootstrap flow is incomplete. See [Deferred Issues](Issues.md).

## Version Sources

| Source | Version |
|---|---|
| `package.json` | `0.1.0` |
| `src-tauri/tauri.conf.json` | `0.1.0` |
| `src-tauri/Cargo.toml` | `0.1.0` |
| Settings screen text | `v1.0.0` |

TODO: Decide the authoritative product version and align the Settings screen with package/Tauri metadata.
