# AGENTS.md — `src/firebase/`

Lazy Firebase SDK initialization. **Two principles**: (1) the SDK is never loaded until the user opts into sync or Analytics is configured, and (2) the security model lives in `firestore.rules`, not in the client.

## STRUCTURE

```
src/firebase/
├── config.ts                  # Lazy Firebase SDK init via dynamic import + cached getters
├── env.ts                     # VITE_FIREBASE_* env-var access with emulator-aware defaults
└── __tests__/
    ├── config.test.ts         # Unit tests for the lazy-init contract
    └── firestore-rules.test.ts # @firebase/rules-unit-testing integration tests (skipped if no emulator)
```

## THE LAZY-IMPORT CONTRACT

`config.ts:1-9` states the contract explicitly:

> Firebase SDK is NOT imported or initialized until the user opts into sync or Analytics is configured for this build. This keeps the local-mode bundle lean and avoids Firebase operations when no Firebase-backed feature is active.

**Never** write `import 'firebase/...'` at module top level. Always use the cached getters:

- `getFirebaseApp()` — `import('firebase/app').then(...)`
- `getFirebaseAuth()` — `import('firebase/auth').then(...)`
- `getFirebaseFirestore()` — `import('firebase/firestore').then(...)`
- `getFirebaseAnalytics()` — `import('firebase/analytics').then(...)`

All four are memoized so the SDK is loaded once per process. Callers in `src/services/auth-service.ts`, `src/services/sync-service.ts`, and `src/repositories/firestore-backend.ts` use only the getters, never direct `import()`.

## SECURITY MODEL

Two rules are non-negotiable:

1. **`VITE_*` env values are embedded in the client bundle.** They are not secrets. (`docs/CONFIGURATION.md:80`.) Firebase web API keys are identifiers, not server secrets. The security boundary is `firestore.rules` at the repository root, not the client.
2. **Do not add per-document security checks in client code.** The client should never trust itself — Firestore rules must be the source of truth. Tests for the rules live in `src/firebase/__tests__/firestore-rules.test.ts` (using `@firebase/rules-unit-testing`).

If you add a new collection or document shape, update `firestore.rules` **and** the corresponding converter in `src/repositories/workspace-firestore-converters.ts` (for workspace) or `src/repositories/firestore-backend.ts` (for prompt/folder).

## EMULATOR SUPPORT

`src/firebase/env.ts` reads `VITE_USE_EMULATOR` and connects to local emulators when set:

- `VITE_EMULATOR_AUTH_HOST` (default `http://localhost:9099`)
- `VITE_EMULATOR_FIRESTORE_HOST` (default `localhost:8080`)

The emulator is also required for `firestore-rules.test.ts` — that test is `describe.skip` when `FIRESTORE_EMULATOR_HOST` is unset. CI does not run the rules test; contributors can run it locally with `firebase emulators:start` and `VITE_USE_EMULATOR=true`.

## ANTI-PATTERNS

- **No module-level Firebase imports.** Always `await import('firebase/...')` inside the cached getters or inside service methods.
- **No `firebase` imports outside `src/firebase/`, `src/services/auth-service.ts`, `src/services/sync-service.ts`, and `src/repositories/firestore-backend.ts`.** New modules that need Firebase go through the getters.
- **No secrets in `VITE_*`.** The bundle is public; secrets live in `firestore.rules` or in server-side Cloud Functions.
- **No per-document security logic in client code.** Trust `firestore.rules`.
- **No `firebase/analytics` writes outside `src/services/analytics-service.ts`.** Analytics is centralized so its error-swallowing guarantee (never block product workflows) cannot be circumvented.

## ADDING A NEW FIREBACK COLLECTION

1. Add the document shape + converter to `src/repositories/workspace-firestore-converters.ts` (workspace types) or `src/repositories/firestore-backend.ts` (prompt/folder types).
2. Add the access rules to `firestore.rules` at the repo root.
3. Add a test case to `src/firebase/__tests__/firestore-rules.test.ts` that exercises both the allow and deny paths.
4. Update the converter test or the repository test to cover the new shape.
5. Update `docs/API.md` and `docs/SYNC.md` to document the new collection.
