# Deployment

PromptDock can be built as a static frontend, packaged as a Tauri desktop app, and optionally connected to Firebase Auth/Firestore for sync.

## Build Prerequisites

- Node.js 20.19 or newer. Use the checked-in `.nvmrc` for the recommended local version.
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
- Optional Firebase sync and Analytics require `VITE_FIREBASE_*` values at build time.

The production Firebase Hosting site is:

```text
https://promptdock-95e31.web.app
```

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

## Branching and Release Flow

Use `develop` as the integration branch for day-to-day work. All regular
feature, fix, and documentation pull requests should target `develop` instead
of `main`.

Keep `main` release-only. When cutting a release, open a release pull request
from `develop` into `main`, confirm the release checklist is complete, then
merge `develop` into `main`. The production Firebase Hosting workflow runs on
pushes to `main`, and desktop release workflows run from `v*` tags or manual
workflow dispatches.

Release pull requests should use `.github/PULL_REQUEST_TEMPLATE/release.md`.
Create release tags only from `main`, and use the `vX.Y.Z` format.

## Firebase Deployment

The web app deploys to Firebase Hosting from GitHub Actions on pushes to `main`
and can also be deployed manually from the Actions tab.

Required GitHub Actions secret:

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_PROMPTDOCK_95E31` | Firebase service account JSON used by the Hosting deploy action. |

Optional GitHub Actions config for browser sync:

| Name | Type | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Secret | Firebase web API key baked into the Vite bundle. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Variable | Firebase Auth domain. Defaults to `promptdock-95e31.firebaseapp.com` in the workflow. |

Manual deploy from a local machine:

```bash
npm run build
firebase deploy --only hosting --project promptdock-95e31
```

Firestore deployment is only needed for synced mode:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Relevant files:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

Before production sync rollout, deploy the latest Firestore rules and enable the Firebase Authentication providers used by the app: Email/Password and Google.

## Environment Strategy

| Environment | Recommended config |
|---|---|
| Local-only development | Empty Firebase values, `VITE_USE_EMULATOR=false`. |
| Emulator sync development | Demo Firebase values, `VITE_USE_EMULATOR=true`. |
| Production browser build | Production Firebase values only if sync is enabled for browser users. |
| Production Tauri build | Production Firebase values only if sync is enabled for desktop users. |

Remember: `VITE_` variables are baked into the frontend bundle.

## CI/CD Notes

The repository includes:

- `.github/workflows/firebase-hosting.yml` for Firebase Hosting deploys on pushes to `main`.
- `.github/workflows/release-macos.yml` for signed and notarized macOS releases.
- `.github/workflows/release-windows.yml` for Windows installer builds.

The Firebase Hosting workflow can be started manually from GitHub Actions. The
desktop release workflows run on tag pushes that match `v*` and can also be
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

If these secrets are not configured, the macOS release workflow skips the DMG
build instead of failing the release run. After configuring the secrets, rerun
the macOS release workflow manually with the target release tag to attach macOS
assets.

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
xcrun stapler validate PromptDock_0.2.0_aarch64.dmg
```

### Windows installer builds

Windows release assets are built on the `windows-latest` GitHub Actions runner
with `tauri-apps/tauri-action`. The workflow collects installer artifacts from:

```text
src-tauri/target/release/bundle/
```

Expected release assets are `.msi` and/or `.exe` installers, depending on the
bundle targets Tauri produces for the current configuration.

## Current Build Status

`npm run tauri build`, `npm test`, and `cargo check` passed locally during the
Windows support update. Keep the release workflows green before publishing
desktop assets.

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

- Release pull request from `develop` into `main` is open and green.
- Release PR uses `.github/PULL_REQUEST_TEMPLATE/release.md`.
- `npm test` passes or known failures are explicitly accepted.
- `npm run build` passes.
- Tauri desktop smoke test passes on the target OS.
- Quick launcher hotkey, copy, and paste flows work in packaged or release-like mode.
- Firebase emulator sync flow works if sync is included.
- Firestore rules/indexes are deployed before enabling production sync.
- Product version is aligned across `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and in-app About text.
