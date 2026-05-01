# Deployment

PromptDock can be built as a static frontend, packaged as a Tauri desktop app, and optionally connected to Firebase Auth/Firestore for sync.

## Build Prerequisites

- Node.js 18 or newer.
- npm dependencies installed with `npm install`.
- Rust stable.
- Tauri 2 OS prerequisites for the target platform.
- Firebase CLI if deploying Firestore rules/indexes.

## Frontend Build

```bash
npm run build
```

This runs:

```bash
tsc && vite build
```

Output:

```text
dist/
```

Preview locally:

```bash
npm run preview
```

Browser hosting requirements:

- Static file hosting is enough for the frontend.
- Browser runtime uses `window.localStorage`.
- Desktop-only features such as global hotkeys, tray, Tauri Store, and paste simulation are unavailable.
- Optional Firebase sync requires `VITE_FIREBASE_*` values at build time.

## Tauri Desktop Build

```bash
npm run tauri build
```

Tauri uses:

- `beforeBuildCommand`: `npm run build`
- `frontendDist`: `../dist`
- bundle config from `src-tauri/tauri.conf.json`
- Rust app code in `src-tauri/src/`

Output is platform-specific and written under:

```text
src-tauri/target/release/bundle/
```

The checked-in bundle config has `"active": true` and includes PNG, ICNS, and ICO icons.

## Firebase Deployment

Only needed for synced mode.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Relevant files:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

Before production sync rollout, resolve workspace bootstrap. Current rules require workspace membership for prompt reads/writes, but signup only creates a user document. See [Deferred Issues](Issues.md).

## Environment Strategy

| Environment | Recommended config |
|---|---|
| Local-only development | Empty Firebase values, `VITE_USE_EMULATOR=false`. |
| Emulator sync development | Demo Firebase values, `VITE_USE_EMULATOR=true`. |
| Production browser build | Production Firebase values only if sync is enabled for browser users. |
| Production Tauri build | Production Firebase values only if sync is enabled for desktop users. |

Remember: `VITE_` variables are baked into the frontend bundle.

## CI/CD Notes

The repository includes `.github/workflows/release-macos.yml` for signed and
notarized macOS releases. It runs on tag pushes that match `v*` and can also be
started manually from GitHub Actions.

Recommended CI jobs:

1. Install npm dependencies with `npm ci`.
2. Run `npm test`.
3. Run `npm run build`.
4. Run Rust checks for Tauri code, for example `cargo check --manifest-path src-tauri/Cargo.toml`.
5. Build platform-specific Tauri bundles on the matching OS runners.
6. Optionally deploy Firestore rules/indexes from a protected branch.

Example high-level release gate:

```bash
npm ci
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri build
```

### macOS signing and notarization

Unsigned or ad-hoc signed macOS apps can appear to work locally but fail after a
browser download because Gatekeeper applies quarantine checks. Production macOS
release assets must be signed with a Developer ID Application certificate and
notarized by Apple before upload.

Required GitHub Actions secrets:

| Secret | Description |
|---|---|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` export of the Developer ID Application certificate. |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12`. |
| `APPLE_ID` | Apple ID email used for notarization. |
| `APPLE_PASSWORD` | App-specific password for the Apple ID. |
| `APPLE_TEAM_ID` | Apple Developer Team ID. |

To create `APPLE_CERTIFICATE`, export the Developer ID Application certificate
from Keychain Access as a `.p12`, then encode it:

```bash
openssl base64 -A -in DeveloperIDApplication.p12 -out certificate-base64.txt
```

Store the contents of `certificate-base64.txt` as the `APPLE_CERTIFICATE`
secret. The workflow imports this certificate into an ephemeral keychain,
discovers the `Developer ID Application` signing identity, and passes it to the
Tauri build through `APPLE_SIGNING_IDENTITY`. Release assets are uploaded to
GitHub only after the signed app and DMG pass verification.

After a successful release build, the workflow verifies the app and DMG with:

```bash
codesign --verify --deep --strict --verbose=4 PromptDock.app
spctl -a -vv PromptDock.app
xcrun stapler validate PromptDock.app
xcrun stapler validate PromptDock_0.1.0_aarch64.dmg
```

## Current Build Status

`npm run build` passed locally during the macOS signing workflow update. Keep
the release workflow green before publishing signed desktop assets.

## Rollback Strategy

### Browser/static deployment

- Keep immutable build artifacts or hosting-provider releases.
- Roll back by promoting the previous known-good `dist/` artifact or previous hosting release.
- Avoid changing Firestore rules and frontend code in the same deployment unless both are covered by emulator tests.

### Tauri desktop release

- Keep signed installers for each released version.
- Roll back by publishing the previous installer/version through the same distribution channel.
- If auto-update is added later, use staged rollout and retain previous update manifests.

### Firebase rules/indexes

- Keep rules and index changes in version control.
- Roll back by deploying the previous `firestore.rules` and `firestore.indexes.json`.
- Be careful with rules rollbacks that may lock out existing users or expose data too broadly.

## Release Checklist

- `npm test` passes or known failures are explicitly accepted.
- `npm run build` passes.
- Tauri desktop smoke test passes on the target OS.
- Quick launcher hotkey, copy, and paste flows work in packaged or release-like mode.
- Firebase emulator sync flow works if sync is included.
- Firestore rules/indexes are deployed before enabling production sync.
- Product version is aligned across `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and in-app About text.
