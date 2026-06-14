# AGENTS.md — `e2e-tauri/`

A **second E2E suite** for the Tauri desktop binary. Distinct from the Playwright browser suite in `/e2e/`. Both coexist in the repo on purpose.

## WHY TWO SUITES?

| Suite | Framework | Runtime | What it covers |
|---|---|---|---|
| `/e2e/` | Playwright | Browser-only (`http://127.0.0.1:1420` via `npm run dev`) | Library, prompt lifecycle, settings, search, import/export, responsive layout, onboarding — anything that runs in a normal webview |
| `/e2e-tauri/` | WebDriverIO + `tauri-driver` | Tauri desktop binary (Linux/Windows runners only) | Desktop-only behavior: global hotkey registration, clipboard, paste-into-active-app, system tray, window show/hide |

The browser suite is fast and runs on every PR. The desktop suite is slower and runs on a separate CI job (`.github/workflows/ci.yml`'s `xvfb-run -a npm run test:e2e:tauri` step on Linux; equivalent on Windows). macOS Tauri e2e is not part of the standard CI matrix.

## STRUCTURE

```
e2e-tauri/
├── wdio.conf.mjs               # WebdriverIO config (Jasmine framework)
├── tauri-e2e-ports.mjs         # Port-resolution helper
├── tauri-e2e-ports.test.mjs    # Vitest unit test for the port resolver
├── tauri.e2e.conf.json         # tauri-driver config
├── run-tauri-e2e.mjs           # Runner script (builds + starts the binary + runs WebdriverIO)
└── specs/
    └── desktop-smoke.e2e.mjs   # Desktop smoke test
```

The port-resolver is unit-tested under Vitest (it's included in the `vitest.config.ts` `include` glob via `e2e-tauri/**/*.test.mjs`), so the suite ships with its own fast feedback loop without launching the Tauri binary.

## CONFIGURATION

- `wdio.conf.mjs` registers the Jasmine framework, the local runner, the spec reporter, and a single Chromium-based browser session.
- `tauri.e2e.conf.json` tells `tauri-driver` which binary to launch and which port to use.
- `run-tauri-e2e.mjs` orchestrates the full flow: build the Tauri binary, start `tauri-driver`, run WebDriverIO against it, tear down on exit.

## CI

`npm run test:e2e:tauri` is gated on Linux + Windows runners with `xvfb-run -a` for headless display. macOS is excluded because the Tauri paste-into-active-app test requires real accessibility permissions that CI cannot grant. The CI step is one of the six required merge checks defined in `.github/workflows/ci.yml`.

## RUNNING LOCALLY

```bash
# Start the binary
cargo tauri dev
# In another shell, run the WebDriverIO suite
npm run test:e2e:tauri
```

Or use the bundled runner (builds + starts):

```bash
node e2e-tauri/run-tauri-e2e.mjs
```

The runner expects `cargo`, `tauri-driver`, and the WebDriverIO dev dependencies to be installed.

## ANTI-PATTERNS

- **Do not add a Tauri-only test to `/e2e/`.** The browser suite is intentionally Tauri-free. Tests that need clipboard simulation, hotkey registration, or window control belong in `e2e-tauri/specs/`.
- **Do not add a browser-only flow to `e2e-tauri/`.** That doubles the CI cost for no gain — put it in the Playwright suite.
- **Do not skip the `tauri-e2e-ports.test.mjs` Vitest test** when changing the port resolver; the runtime test depends on it.
- **Do not commit a snapshot or recording** to this directory. The suite is smoke-only; no visual diff.
- **Do not add macOS-only tests** unless you also wire a macOS runner — they will silently pass on Linux/Windows without exercising the macOS path.
