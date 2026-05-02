# Troubleshooting

Use this guide when setup, runtime behavior, sync, tests, or builds are not behaving as expected.

## Setup Issues

### `npm install` fails

- Confirm Node.js is at least 18.
- Delete `node_modules/` and reinstall if local dependencies are corrupted.
- Prefer `npm ci` in CI or release checks because `package-lock.json` is committed.

### `npm run dev` cannot start

Vite is configured for port `1420` with `strictPort: true`.

Fix:

```bash
lsof -i :1420
```

Stop the conflicting process, then rerun:

```bash
npm run dev
```

### `npm run tauri dev` fails before opening the app

Check:

- Rust stable is installed.
- Tauri OS prerequisites are installed.
- `npm run dev` can start on port `1420`.
- Native dependencies are available for your platform.

## Runtime Issues

### Browser mode does not have desktop features

Expected behavior:

- No global system hotkey.
- No Tauri tray.
- No Tauri Store files.
- No native paste simulation.

Use `npm run tauri dev` to test desktop behavior.

### App always shows onboarding

Onboarding completion is stored in localStorage under:

```text
promptdock_onboarding_complete
```

Clearing browser or WebView storage resets onboarding.

### Browser prompt data disappears

Browser data is stored in localStorage keys:

```text
promptdock:prompts
promptdock:folders
promptdock:settings
promptdock:workspace
```

Clearing localStorage removes browser-runtime data.

### Desktop prompt data fails to load

The Tauri backend stores JSON data through the Tauri Store plugin:

```text
prompts.json
folders.json
settings.json
workspace.json
```

`LocalStorageBackend` tries to recover corrupted store data by preserving a `.backup.json` store and reinitializing defaults. Check the Tauri console logs for recovery messages.

## Clipboard, Paste, and Hotkey

### Copy fails in browser mode

Browser clipboard APIs may require:

- HTTPS or localhost.
- User gesture.
- Clipboard permissions.

PromptDock falls back to a temporary textarea copy path when possible.

### Paste into the active app does not work

Paste simulation is Tauri-only. It copies text first, hides/focuses as needed, then invokes `paste_to_active_app`.

Check:

- You are running the Tauri app, not browser Vite.
- The target app is focused after PromptDock hides.
- macOS privacy/security settings allow input simulation if required.
- Clipboard contains the rendered prompt; even if paste fails, copy may have succeeded.

### Global hotkey does not open the quick launcher

Check:

- You are running `npm run tauri dev`.
- No other app owns `CommandOrControl+Shift+P`.
- Settings hotkey is valid.
- The quick-launcher window exists in `src-tauri/tauri.conf.json` with label `quick-launcher`.

If a custom hotkey fails, `register_hotkey` should surface an error in Settings.

## Firebase and Sync

### `Firebase configuration is missing`

This means one or more required sync variables are absent:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
```

Fix:

- Stay in local mode, or
- Fill `.env.local`, restart Vite/Tauri, and retry sync.

Analytics also requires these variables plus:

```text
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

If either Analytics-only value is missing, sync can still work but Analytics remains disabled.

### Emulator connection fails

Check:

```bash
firebase emulators:start
```

Expected ports:

| Emulator | Port |
|---|---:|
| Auth | 9099 |
| Firestore | 8080 |
| UI | 4000 |

Set:

```dotenv
VITE_USE_EMULATOR=true
VITE_EMULATOR_AUTH_HOST=http://localhost:9099
VITE_EMULATOR_FIRESTORE_HOST=localhost:8080
```

Restart the app after changing env vars.

### Firestore `permission-denied`

Firestore prompt reads/writes require workspace membership. Sign-in now bootstraps `/workspaces/{uid}` and `/workspaces/{uid}/members/{uid}`, so first check that the latest `firestore.rules` are deployed and that the signed-in user has an owner membership document.

For local emulator work, restart the Firebase emulators after changing rules.

### Prompts disappear after sync transition

Synced mode uses the Firebase user ID as the default workspace ID. If prompts disappear after sign-in, confirm the active workspace setting is the signed-in user ID and reload prompts after sync finishes.

See [Deferred Issues](Issues.md).

## Import/Export

### Import says JSON is invalid

The import document must be an object with:

```json
{
  "version": "1.0",
  "exportedAt": "2026-05-01T00:00:00.000Z",
  "prompts": []
}
```

Each prompt requires:

- `title`: non-empty string
- `body`: string

### Duplicate prompts appear during import

Duplicate detection compares incoming prompts to existing prompts by:

- title
- body
- both

The UI lets the user skip duplicates or overwrite existing prompts.

## Build and Test Issues

### `npm run build` fails with `Property 'pasted' does not exist on type 'never'`

Current known failure:

```text
src/components/AppShell.tsx(578,24): error TS2339: Property 'pasted' does not exist on type 'never'.
```

Cause:

- `pasteToActiveApp()` currently returns `Promise<void>`.
- `AppShell` awaits it and checks `result?.pasted`.

TODO: Align the helper return type and the `AppShell` caller.

### `npm test` has failures

Current known failures are documented in [Testing](TESTING.md). They appear to be a mix of implementation/test drift and one property expectation mismatch around trimmed search queries.

Run a targeted test while debugging:

```bash
npx vitest run src/components/__tests__/PromptInspector.test.tsx
```

### React `act(...)` warnings in tests

Some component tests trigger asynchronous state updates after events. Wrap async interactions with Testing Library helpers or `waitFor()` so assertions happen after the UI settles.

## Known Limitations

- No checked-in CI workflow.
- No configured E2E runner for full Tauri behavior.
- No Rust unit tests for native commands.
- Sync conflict state is in memory.
- Folder persistence is not workspace-aware and currently bypasses the repository abstraction.
- Settings screen contains a product version string (`v1.0.0`) that does not match package/Tauri/Cargo version `0.1.0`.
