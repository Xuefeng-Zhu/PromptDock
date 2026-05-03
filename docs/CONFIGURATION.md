# Configuration

PromptDock has three configuration surfaces:

- Vite environment variables for optional Firebase sync and Analytics.
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
| `VITE_FIREBASE_APP_ID` | Analytics only | none | `src/firebase/config.ts` | Firebase web app ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics only | none | `src/firebase/config.ts` | Google Analytics measurement ID for the Firebase web app. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | none | `src/firebase/config.ts` | Optional Firebase web app config field. |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | none | `src/firebase/config.ts` | Optional Firebase web app config field. |
| `VITE_FIREBASE_ANALYTICS_ENABLED` | No | `true` | `src/firebase/config.ts` | Set to `false` to disable Analytics even when configured. Analytics is also disabled in emulator mode. |
| `VITE_USE_EMULATOR` | No | `false` | `src/firebase/config.ts` | Set to `true` to connect Firebase SDKs to local emulators. |
| `VITE_EMULATOR_AUTH_HOST` | No | `http://localhost:9099` | `src/firebase/config.ts` | Auth emulator URL. |
| `VITE_EMULATOR_FIRESTORE_HOST` | No | `localhost:8080` | `src/firebase/config.ts` | Firestore emulator host and port. |

If required Firebase variables are missing, `getFirebaseApp()` throws. Local mode is still usable without these variables as long as the user does not start sync.

Firebase Authentication must have Email/Password and Google providers enabled for the corresponding sign-in buttons to work. Google sign-in uses the same Firebase web app config; no extra Vite variable is required.

## Example Local Configuration

Local-only:

```dotenv
VITE_USE_EMULATOR=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_ANALYTICS_ENABLED=true
VITE_EMULATOR_AUTH_HOST=http://localhost:9099
VITE_EMULATOR_FIRESTORE_HOST=localhost:8080
```

Firebase emulator development:

```dotenv
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_ANALYTICS_ENABLED=true
VITE_EMULATOR_AUTH_HOST=http://localhost:9099
VITE_EMULATOR_FIRESTORE_HOST=localhost:8080
```

Assumption: The exact demo values do not matter for emulator-only work, but a Firebase app config object is still required by the SDK.

Firebase Analytics:

- Analytics initializes only when `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_MEASUREMENT_ID` are present.
- Analytics sends app open, screen view, and generic prompt action events. Prompt titles, bodies, tags, and variable values are not sent.
- `VITE_USE_EMULATOR=true` disables Analytics so emulator traffic does not pollute production reports.

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
| `.nvmrc` | Recommended Node.js major version for local development and CI. |
| `rust-toolchain.toml` | Rust stable toolchain selection for Tauri development. |
| `eslint.config.js` | ESLint flat config for TypeScript, React Hooks, and React refresh rules. |
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
- Version: `0.2.0`
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

`firestore.rules` expects authenticated users to access only their own user/settings documents and workspace resources where they have membership. `AuthService` bootstraps the default workspace and owner membership after email/password or Google sign-in.

## Version Sources

| Source | Version |
|---|---|
| `package.json` | `0.2.0` |
| `src-tauri/tauri.conf.json` | `0.2.0` |
| `src-tauri/Cargo.toml` | `0.2.0` |
| Settings screen text | `v0.2.0` |

Keep these values aligned when cutting a release.
