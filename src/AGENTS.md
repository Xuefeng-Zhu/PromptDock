# AGENTS.md — `src/`

Top of the source tree. Subdirectory `AGENTS.md` files (`src/components/`, `src/services/`, `src/repositories/`, `src/stores/`, `src/hooks/`, `src/utils/`, `src/firebase/`) document layer-specific rules; this file captures cross-layer rules every contributor must follow.

## OVERVIEW

PromptDock's source is organized as a strict five-layer pipeline. The layers only know about the layer directly below them:

```
UI (src/components, src/screens)
  ↓ useXxxStore(selector) hooks
Zustand Stores (src/stores)  — 4 core + 2 auxiliary
  ↓ I*Repository interface
Repositories (src/repositories)  — local cache + optional Firestore delegate
  ↓ IStorageBackend  |  FirestoreBackend
Storage Backends (Tauri Store / window.localStorage / Firestore)
```

The two outbound edges that bypass the pipeline are Tauri commands (`src-tauri/` ↔ `src/utils/`) and Firebase Auth/Firestore (lazy dynamic imports in `src/firebase/`).

## NON-NEGOTIABLE RULES

1. **Components never import from `src/repositories/`.** They read/write exclusively through Zustand store hooks. (`docs/ARCHITECTURE.md:264`.)
2. **Backend construction is split by initialization site, not owned by repositories.** `LocalStorageBackend` and `BrowserStorageBackend` are constructed in `App.tsx:117-120` during startup and injected into the four repositories via their constructors. `FirestoreBackend` is constructed lazily inside `SyncService.transitionToSynced` (`services/sync-service.ts:107-108`) and installed onto `PromptRepository` / `FolderRepository` via `setFirestoreDelegate()` (set/cleared by `AppSyncLifecycle.wireFirestoreDelegates`). Repositories accept the chosen backend — they do not construct it. `WorkspaceRepository` does **not** use the delegate pattern; its synced methods call Firestore directly via dynamic `await import('firebase/firestore')` and bypass the backend entirely. (See `src/repositories/AGENTS.md`.)
3. **Stores never touch `localStorage` / Tauri Store / Firestore directly.** Persistence lives in repositories. (`app-mode-store` is the only exception — pure state, no repository.)
4. **No module-level Firebase imports.** All `firebase/...` imports are dynamic `await import(...)` inside cached getters in `src/firebase/config.ts`. (See `src/firebase/AGENTS.md`.)
5. **No `@tauri-apps/*` imports in `src/components/`.** The only direct bridge in components is `src/components/ui/HotkeyRecorder.tsx` (which uses `src/utils/hotkey-recorder.ts`, a pure-JS converter). All other Tauri surface funnels through `src/utils/` and `src/hooks/`.
6. **Tauri `invoke()` calls are wrapped in `try { invoke(...) } catch { /* browser fallback */ }`.** Browser fallbacks are `navigator.clipboard` and `showSaveFilePicker`. Detection is centralized in `src/utils/runtime.ts` (`isTauriRuntime()`).
7. **Stores throw on use-before-init.** `initXxxStore(repo)` must be called once before any `useXxxStore(selector)` consumer. `App.tsx`'s `runAppInitialization()` is idempotent via a module-level `initialized` flag and shared `initializationPromise`.
8. **Background services are disabled in tests and auxiliary windows** (`App.tsx:53-55`) so the quick-launcher window does not duplicate events from the main window.

## LAYER INDEX

| Path | Purpose | AGENTS.md |
|---|---|---|
| `src/App.tsx`, `src/main.tsx` | Root component, initialization, runtime detection, window label routing | — |
| `src/components/` | React UI (25 feature subdirs + 22-subdir `__tests__/`) | `src/components/AGENTS.md` |
| `src/components/ui/` | Reusable design-system primitives (Button, Card, HotkeyRecorder, etc.) | `src/components/ui/AGENTS.md` |
| `src/components/app-shell/` | Root layout + screen routing — orchestrates all 6 stores | `src/components/app-shell/AGENTS.md` |
| `src/components/settings/` | 17 settings cards; runtime-gates hotkey/paste | `src/components/settings/AGENTS.md` |
| `src/screens/` | ConflictCenter + separate Tauri quick-launcher webview windows | — (small) |
| `src/stores/` | Zustand stores (4 core + 2 auxiliary) | `src/stores/AGENTS.md` |
| `src/services/` | Business logic (7 pure + 3 Firebase + 1 orchestrator) | `src/services/AGENTS.md` |
| `src/repositories/` | Data access (3 backends, 4 repositories) | `src/repositories/AGENTS.md` |
| `src/hooks/` | Cross-screen + screen-local React hooks | `src/hooks/AGENTS.md` |
| `src/utils/` | Pure helpers (6 buckets) | `src/utils/AGENTS.md` |
| `src/firebase/` | Lazy Firebase SDK init + rules | `src/firebase/AGENTS.md` |
| `src/contexts/`, `src/data/`, `src/types/`, `src/test-utils/` | Single-purpose; no AGENTS.md needed | — |

## CROSS-LAYER ANTI-PATTERNS

| Anti-pattern | Enforcement |
|---|---|
| Persisted toasts | `stores/toast-store.ts:25` — toasts are in-memory only |
| Persisted conflicts | `services/conflict-service.ts` — conflicts are in-memory only; cleared on reload |
| Hidden folder creation | `services/prompt-json.ts:28` — single-prompt JSON import resolves `folder`/`folderId` against existing folders only |
| Analytics interrupts UI | `services/analytics-service.ts:30` — all errors swallowed so tracking can never block product workflows |
| Tag index reliance | Tags are derived from prompt arrays; there is no canonical tag index yet |
| Personal workspace deletion | `stores/workspace-store.ts:242` — throws |
| Owner self-demote / self-remove | `stores/workspace-store.ts:369,386` — throws |
| Viewer mutation | All viewer denials throw + toast; see `src/stores/AGENTS.md` for the full catalog |
| Server secrets in `VITE_*` | Forbidden by `docs/CONFIGURATION.md:80`; `VITE_*` is embedded in the client bundle |
| CSP loosening | Forbidden — `src-tauri/tauri.conf.json` CSP allowlist is hand-edited and only contains Firebase/loopback origins |

## INITIALIZATION ORDER (App.tsx)

`runAppInitialization()` (App.tsx:104-202) builds the runtime in this order:

1. Detect Tauri runtime (`isTauriRuntime()`); pick `LocalStorageBackend` or `BrowserStorageBackend` (App.tsx:114-122)
2. Construct repositories from the backend (App.tsx:132-135)
3. Initialize the 5 main stores via `initXxxStore(repo)` (App.tsx:138-142)
4. Load prompts, folders, settings (App.tsx:150-152)
5. Register the global hotkey from settings (App.tsx:158)
6. Build `ConflictService` and `AuthService` (App.tsx:167, 172)
7. Build `AppSyncLifecycle` with all 5 stores + both repos + auth + conflict service (App.tsx:176-190) — the only construction site that wires them together
8. `syncLifecycleInstance.start()` and `restoreAuthSession()` (App.tsx:191-199)

`toast-store` is the only store that does not use `init*Store` — its singleton is the `create()` call at module load.

## NOTES

- **No path aliases.** `tsconfig.json` has no `paths` and `vite.config.ts` has no `resolve.alias`. All imports are relative (e.g., `from '../stores/prompt-store'`). Verified across `src/`.
- **No `.husky` / commitlint / pre-commit hooks.** CI is the only enforcement point.
- **No `TODO` / `FIXME` / `HACK` / `@deprecated` markers** anywhere in `src/**/*`. `docs/Issues.md` is the only deferred-issues register.
- **The docs are authoritative**: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/TESTING.md`, `docs/CONFIGURATION.md`, `docs/SYNC.md`, `docs/API.md`, `docs/TROUBLESHOOTING.md`. The AGENTS.md hierarchy is a fast-reference index, not a replacement.
