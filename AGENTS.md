# AGENTS.md — PromptDock

## Project Overview

PromptDock is a local-first, cross-platform prompt recipe manager built with Tauri 2 + React 19 + TypeScript 6 + Vite 8 + Zustand + Tailwind CSS v4. It also runs in a regular browser (no Tauri required) using a localStorage fallback.

Users create, organize, and reuse AI prompt templates with `{{variable}}` placeholders. A global hotkey opens a quick launcher overlay for rapid search-and-paste into any application.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19.2.6, TypeScript 6.0.3, Vite 8.0.13 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| State management | Zustand 5 |
| Persistence (desktop) | `@tauri-apps/plugin-store` (JSON files on disk) |
| Persistence (browser) | `window.localStorage` via `BrowserStorageBackend` |
| Cloud sync (optional) | Firebase Auth + Cloud Firestore |
| Testing | Vitest 4.1.6, @testing-library/react, fast-check (PBT), Playwright |
| Icons | lucide-react |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (React Components)                            │
│  AppShell, LibraryScreen, PromptEditor, SettingsScreen, │
│  OnboardingScreen, QuickLauncherWindow, ConflictCenter  │
├─────────────────────────────────────────────────────────┤
│  State Layer (Zustand Stores)                           │
│  PromptStore, FolderStore, SettingsStore,               │
│  WorkspaceStore, AppModeStore, ToastStore               │
├─────────────────────────────────────────────────────────┤
│  Service Layer                                          │
│  AuthService, SyncService, AppSyncLifecycle,            │
│  ConflictService, ImportExportService, SearchEngine,    │
│  VariableParser, PromptJson, Analytics                  │
├─────────────────────────────────────────────────────────┤
│  Repository Layer                                       │
│  PromptRepository, FolderRepository,                    │
│  SettingsRepository, WorkspaceRepository                │
│  (delegates to IStorageBackend)                         │
├─────────────────────────────────────────────────────────┤
│  Storage Backends                                       │
│  LocalStorageBackend (Tauri Store plugin)               │
│  BrowserStorageBackend (window.localStorage)            │
│  FirestoreBackend (Cloud Firestore — synced mode)       │
├─────────────────────────────────────────────────────────┤
│  Native Commands (Tauri only)                           │
│  copy_to_clipboard, paste_to_active_app,                │
│  register_hotkey, unregister_hotkey,                    │
│  toggle_quick_launcher, show/hide main window           │
└─────────────────────────────────────────────────────────┘
```

### Runtime Detection

`App.tsx` checks `'__TAURI_INTERNALS__' in window` at startup:
- **Tauri runtime**: Uses `LocalStorageBackend` (Tauri Store plugin for disk persistence)
- **Browser runtime**: Uses `BrowserStorageBackend` (window.localStorage)

All Tauri `invoke()` calls in utility modules (`clipboard.ts`, `hotkey.ts`) are wrapped in try/catch with browser API fallbacks.

## Directory Structure

```
src/
├── App.tsx                    # Root component, initialization, runtime detection
├── main.tsx                   # Entry point, window label detection
├── components/                # React UI components
│   ├── app-shell/             # Root layout orchestration
│   ├── library/               # Prompt library grid with filters
│   ├── prompt-editor/         # Create/edit prompt form pieces
│   ├── settings/              # Settings with auth, workspaces, import/export
│   ├── onboarding/            # First-run setup wizard
│   ├── sidebar/               # Navigation sidebar with counts
│   ├── prompt-search/         # ⌘K quick search overlay
│   ├── variable-fill/         # Variable input before copy/paste
│   ├── shared/                # Error boundary and app-shared elements
│   ├── feedback/              # Toast notification renderer
│   ├── top-bar/               # App header with search and workspaces
│   ├── workspaces/            # Workspace switcher and visual markers
│   ├── ui/                    # Shared reusable UI components (Button, Card, Input, etc.)
│   └── __tests__/             # Component tests and property-based tests
├── screens/                   # Full-screen views
│   ├── QuickLauncherWindow.tsx # Separate Tauri window for quick launcher
│   └── ConflictCenter.tsx     # Sync conflict resolution UI
├── stores/                    # Zustand state stores
│   ├── prompt-store.ts        # Prompt CRUD, search, filters
│   ├── folder-store.ts        # Folder CRUD and active workspace
│   ├── settings-store.ts      # User preferences
│   ├── workspace-store.ts     # Workspace selection, sharing, roles, invites
│   ├── app-mode-store.ts      # App mode state machine (local/synced/offline)
│   └── toast-store.ts         # Toast notification queue
├── repositories/              # Data access layer
│   ├── interfaces.ts          # IStorageBackend, IPromptRepository, etc.
│   ├── browser-storage-backend.ts  # Browser localStorage backend
│   ├── local-storage-backend.ts    # Tauri Store plugin backend
│   ├── firestore-backend.ts        # Cloud Firestore backend
│   ├── prompt-repository.ts        # Prompt persistence (delegates to backend)
│   ├── folder-repository.ts        # Folder persistence (delegates to backend)
│   ├── workspace-repository.ts     # Workspace metadata, members, invites
│   └── settings-repository.ts      # Settings persistence
├── services/                  # Business logic (stateless)
│   ├── interfaces.ts          # Service interfaces (IVariableParser, ISearchEngine, IImportExportService, IAuthService)
│   ├── auth-service.ts        # Firebase Auth (sign-in/up/out/restore); lazy dynamic Firebase imports
│   ├── app-sync-lifecycle.ts  # Auth restore and sync lifecycle orchestration; wires all stores
│   ├── sync-service.ts        # Firestore real-time sync; constructs FirestoreBackend lazily
│   ├── conflict-service.ts    # Pure in-memory conflict detection/resolution
│   ├── import-export.ts       # JSON import/export (schema v1.0) with duplicate detection
│   ├── prompt-json.ts         # Single-prompt JSON form-fill parser (folder resolution safe)
│   ├── analytics-service.ts   # Optional Firebase Analytics events (errors always swallowed)
│   ├── search-engine.ts       # Pure local search with field-priority ranking
│   ├── variable-parser.ts     # {{variable}} extraction, first-appearance order
│   └── seed-data.ts           # Default prompts for first launch
├── utils/                     # Pure helpers; see src/utils/AGENTS.md for the 6-bucket categorization
│   ├── clipboard.ts           # Tauri clipboard with browser fallback
│   ├── hotkey.ts              # Tauri hotkey registration
│   ├── hotkey-recorder.ts     # Pure-JS keyboard event → combo string
│   ├── window.ts              # Tauri window fallback helpers
│   ├── file-dialog.ts         # Tauri dialog with browser showSaveFilePicker fallback
│   ├── theme.ts               # CSS theme application (light/dark/system)
│   ├── runtime.ts             # isTauriRuntime() detection (9 consumers)
│   ├── workspace-domain.ts    # Domain invite validation/helpers
│   ├── workspace-records.ts   # Personal workspace + membership ID helpers
│   ├── workspace-role.ts      # Role formatting + getWorkspaceRole
│   ├── folder-names.ts        # Folder name normalization
│   ├── folder-label.ts        # Display label derivation
│   ├── folder-options.ts      # Quick-pick folder rows for combobox
│   ├── prompt-filters.ts      # PromptFilters types + apply/normalize (central, 13 consumers)
│   ├── prompt-variables.ts    # Variable metadata helpers (11 consumers)
│   ├── prompt-template.ts     # {{var}} render + split (uses VariableParser service)
│   ├── prompt-filter-chips.ts # Active chip UI helpers
│   ├── library-filtering.ts   # filterPrompts pipeline
│   ├── library-filter-options.ts # Tag/folder option derivation
│   ├── sidebar-counts.ts      # Sidebar badge counts
│   ├── text-counts.ts         # countWords/countChars (PBT-verified)
│   ├── list-navigation.ts     # clampIndex for keyboard highlight (PBT-verified)
│   ├── tag-options.ts         # Tag dedupe + quick-pick rows
│   ├── error-message.ts       # formatErrorMessage (16 consumers)
│   ├── date-format.ts         # Null-safe date formatters
│   ├── onboarding.ts          # localStorage onboarding-complete flag
│   ├── auth-error-message.ts  # IAuthService error → user copy
│   └── auth-service-availability.ts # isAuthServiceAvailable runtime check
├── contexts/                  # React context providers
│   └── AppModeProvider.tsx    # App mode context
├── firebase/                  # Firebase configuration
│   └── config.ts              # Lazy Firebase initialization
├── types/                     # TypeScript type definitions
│   └── index.ts               # All shared types
├── data/                      # Static/mock data
│   └── mock-data.ts           # Seed prompts and category colors
└── styles.css                 # Tailwind CSS entry point
```

## Key Patterns

### Storage Backend Abstraction

All persistence goes through `IStorageBackend` (defined in `repositories/interfaces.ts`). Repositories accept this interface, not a concrete class. This enables:
- `LocalStorageBackend` for Tauri desktop (JSON files via Tauri Store plugin)
- `BrowserStorageBackend` for browser (window.localStorage)
- `FirestoreBackend` for cloud sync (set via prompt/folder repository delegates)

### Tauri Command Fallback

All Tauri `invoke()` calls follow this pattern:
```typescript
try {
  await invoke('command_name', { args });
} catch {
  // Browser fallback (e.g., navigator.clipboard.writeText)
}
```

### Store Initialization

Zustand stores use a factory + singleton pattern:
1. `createXxxStore(repo)` — factory for testing (returns a standalone store)
2. `initXxxStore(repo)` — initializes the singleton (called once in `App.tsx`)
3. `useXxxStore(selector)` — React hook that reads from the singleton

### Firebase Lazy Loading

Firebase SDK is never imported at module level. All Firebase imports use dynamic `import()` inside async functions in `firebase/config.ts`. Firebase is only loaded when the user opts into sync.

### Component Reusability

Prefer small reusable components over growing screen files. Before adding non-trivial UI, check `src/components/ui/` and nearby components for an existing pattern to reuse or extend.

- Put app-agnostic controls in `src/components/ui/` (for example buttons, inputs, selects, reusable searchable dropdowns, toggles, cards).
- Keep screen components focused on data flow, layout composition, and feature-specific state.
- Extract repeated or generally useful interactions into typed components with clear props instead of hard-coding options, labels, or prompt-specific data inside the UI primitive.
- Keep domain-specific composition in `src/components/` and reusable visual primitives in `src/components/ui/`.
- When extracting UI, preserve accessibility roles/labels and move focused component tests or add coverage at the level where behavior is owned.

### Tauri ↔ Frontend Boundary

- Components must **not** import `@tauri-apps/*` directly. The only direct bridge in `src/components/` is `ui/HotkeyRecorder.tsx` (which talks to `utils/hotkey-recorder.ts`, a pure-JS converter).
- All other Tauri surface funnels through `src/utils/` (clipboard, hotkey, window, file-dialog) and `src/hooks/` (`use-prompt-execution.ts` for copy/paste, `use-settings-actions.ts` for hotkey). New Tauri usage: extend the matching `src/utils/*.ts` module.
- Every Tauri `invoke()` is wrapped in `try { invoke(...) } catch { /* browser fallback */ }`. Browser-mode `navigator.clipboard` / `showSaveFilePicker` are the fallback. Runtime detection is centralized in `src/utils/runtime.ts` (`isTauriRuntime()`).
- See `src-tauri/AGENTS.md` for the command/capability surface and `src/utils/AGENTS.md` for the platform-boundary contract.

### Layered Data Flow

```
UI (src/components, src/screens)
  ↓ useXxxStore hooks only
Zustand Stores (src/stores)
  ↓ I*Repository interface
Repositories (src/repositories) — local cache + optional Firestore delegate
  ↓ IStorageBackend (Local | Browser)  |  FirestoreBackend (cloud)
Storage Backends / Firestore
```

- **Components never import from `src/repositories/`.** They read/write exclusively through Zustand stores. (`docs/ARCHITECTURE.md:264` — *"Components should avoid talking directly to repositories."*)
- **Backend construction is split by initialization site.** `App.tsx:117-120` constructs `LocalStorageBackend` or `BrowserStorageBackend` and injects them into the four repositories. `SyncService.transitionToSynced` (`sync-service.ts:107-108`) constructs `FirestoreBackend` lazily and installs it via `setFirestoreDelegate()` (set/cleared by `AppSyncLifecycle`). Repositories accept the chosen backend — they do not construct it. `WorkspaceRepository` bypasses the delegate and calls Firestore directly.
- **The Zustand cache is observable UI state; the backend store is durable storage.** Don't conflate: stores mutate cache, repositories persist.

### AGENTS.md Hierarchy

This root file is the canonical project knowledge base. Subdirectory `AGENTS.md` files exist at:

| Path | Covers |
|---|---|
| `src/AGENTS.md` | Top of src/ — cross-layer rules, anti-patterns, lazy-import contract |
| `src/components/AGENTS.md` | Component domain map + test conventions |
| `src/components/ui/AGENTS.md` | Reusable design-system primitives |
| `src/components/app-shell/AGENTS.md` | Top-level orchestrator + screen routing |
| `src/components/settings/AGENTS.md` | 17 settings cards + runtime gates |
| `src/services/AGENTS.md` | 7 pure + 3 Firebase + 1 orchestrator services |
| `src/repositories/AGENTS.md` | IStorageBackend + Firestore delegate pattern |
| `src/stores/AGENTS.md` | Factory + Init + Singleton pattern, 4 core + 2 auxiliary |
| `src/hooks/AGENTS.md` | Cross-screen vs screen-local hooks |
| `src/utils/AGENTS.md` | 6-bucket utility categorization, Tauri boundary |
| `src-tauri/AGENTS.md` | Tauri commands + capabilities + Rust layer |
| `src/firebase/AGENTS.md` | Lazy dynamic imports + security model |
| `e2e-tauri/AGENTS.md` | WebDriverIO Tauri E2E (dual E2E framework) |

When changing code, prefer reading the closest AGENTS.md before the root.

### Code Documentation

Keep comments concise and behavior-focused. Prefer TSDoc (`/** ... */`) for exported functions, hooks, classes, store factories, repositories, and shared utilities when the behavior is not obvious from the signature alone.

Add or update comments when code introduces:
- Cross-module contracts or public APIs
- Business rules, data normalization, or persistence mapping
- Runtime-specific behavior for Tauri, browser, Firebase, or sync
- Async side effects, subscriptions, timers, native commands, or event listeners
- Non-obvious algorithms such as filtering, ranking, virtualization, conflict handling, or variable resolution
- Edge cases where future maintainers might otherwise infer the wrong behavior

Avoid comments that restate the implementation. UI components and small helpers do not need TSDoc unless they own a reusable contract or hidden behavior. When behavior changes, update nearby comments in the same patch so documentation stays truthful.

## Design Tokens (Tailwind v4)

Defined as CSS custom properties in `src/styles.css` (no `tailwind.config.js`):

| Group | Tokens |
|---|---|
| Primary | `--color-primary`, `--color-primary-hover`, `--color-primary-light` |
| Surfaces | `--color-background`, `--color-panel`, `--color-border` |
| Text | `--color-text-main`, `--color-text-muted`, `--color-text-placeholder` |
| Category | `--color-cat-{purple,green,amber,blue,rose,teal}` |
| Spacing | `--space-xs/sm/md/lg/xl` (0.25 / 0.5 / 1 / 1.5 / 2 rem) |
| Typography | `--font-sans` (Inter, system-ui, …), `--font-mono` (JetBrains Mono, …) |
| Radii | `--radius-sm/md/lg/xl` (0.375 / 0.5 / 0.75 / 1 rem) |

Themes are switched by `src/utils/theme.ts` writing `class="dark"` / `class="light"` on `<html>`. Use `var(--token)` or arbitrary-value classes like `bg-[var(--color-primary)]`.

## Anti-Patterns (Enforced)

| Pattern | Where | Rule |
|---|---|---|
| `id` mutation | `repositories/prompt-repository.ts`, `workspace-repository.ts` | IDs are immutable; tests assert it |
| Personal workspace deletion | `stores/workspace-store.ts:242` | Throws — cannot delete personal workspace |
| Owner self-demote/remove | `stores/workspace-store.ts:369,386` | Throws — owners cannot demote or remove themselves |
| Viewer mutation | `hooks/app-shell/use-prompt-crud-actions.ts`, `use-app-shell-controller.ts` | Throws + toast — viewers cannot create/edit/archive/restore/delete/move prompts, cannot create/delete folders, cannot edit tags, cannot change favorites, cannot import |
| Module-level Firebase import | `firebase/config.ts` | All Firebase imports are dynamic `await import('firebase/...')` inside cached getters |
| Tauri invoke in components | `components/*/` | Components never import `@tauri-apps/*` — funnel via `src/utils/` or `src/hooks/` |
| Persistence in non-repository | `src/stores/*` (except `app-mode-store`) | Stores never touch `localStorage` / Tauri Store / Firestore directly |
| Persisted toasts | `stores/toast-store.ts:25` | Toasts are in-memory only, never persisted or synced |
| Persisted conflicts | `services/conflict-service.ts` | Conflicts are in-memory only; cleared on reload |
| Analytics interrupt | `services/analytics-service.ts:30` | All errors swallowed so tracking can never block product workflows |
| Hidden folder creation | `services/prompt-json.ts:28` | Single-prompt JSON import resolves `folder`/`folderId` against existing folders; never creates unknown folders |
| Server secrets in `VITE_*` | `docs/CONFIGURATION.md:80` | `VITE_*` values are embedded in the client bundle; Firebase web API keys are identifiers, not secrets (security lives in `firestore.rules`) |
| Use-before-init | `stores/*-store.ts` (e.g. `prompt-store.ts:241`) | Stores throw if accessed before `initXxxStore()`; App.tsx initialization is idempotent via `initializeApp()` guard |
| Pre-commit hooks | (none) | No `.husky`/commitlint in repo; CI is the only enforcement point |
| `TODO`/`FIXME`/`HACK` markers | `src/**/*` | Zero matches — codebase is clean of architectural-debt markers |

## Commands

```bash
# Development
npm run dev              # Vite dev server (browser-only, port 1420)
npm run tauri dev        # Full Tauri dev (frontend + Rust backend)

# Testing
npm run lint             # ESLint guardrails
npm run typecheck        # TypeScript without emitting
npm test                 # Run all tests once (vitest run)
npm run test:e2e         # Browser E2E tests with Playwright Chromium
npm run test:watch       # Watch mode

# Building
npm run build            # Frontend production build (dist/)
npm run tauri build      # Full Tauri production build (platform installer)

# Firebase emulators (optional, for sync development)
firebase emulators:start # Auth (9099), Firestore (8080), UI (4000)
```

## GitHub PR Workflow

- When asked to open a PR, create a ready-for-review PR by default.
- Open a draft PR only when the user explicitly asks for draft, or when there is a known blocker that should prevent review or merge.
- If a PR is opened as draft because of a blocker, state the blocker clearly and mark it ready after the blocker is resolved.

## Testing Conventions

- **Test location**: Co-located `__tests__/` directories next to source files
- **Naming**: `ComponentName.test.tsx`, `service-name.test.ts`
- **Integration tests**: `*.integration.test.tsx` suffix
- **Property-based tests**: `*.property.test.ts` suffix, use `fast-check` with 100+ iterations
- **Environment**: Tests default to `node`; component tests use `// @vitest-environment jsdom` directive
- **Mocking**: Zustand stores are mocked via `vi.mock()` with test-scoped store instances
- **DOM**: `@testing-library/react` for component rendering and interaction
- **Extracted hooks/helpers**: When moving logic out of a component into `src/hooks/` or `src/utils/`, add focused tests in `src/hooks/__tests__/` or `src/utils/__tests__/` that cover the moved behavior. Keep component tests for user-facing contracts, but do not rely on component tests alone for reusable hook or helper logic.

### Running specific tests

```bash
npx vitest run src/components/__tests__/AppShell     # AppShell tests
npx vitest run src/hooks/__tests__/                  # All hook tests
npx vitest run src/utils/__tests__/                  # All utility tests
npx vitest run src/services/__tests__/               # All service tests
npx vitest run 'src/**/*.property.test.ts'           # All property-based tests
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | For sync only | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | For sync only | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | For sync only | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Analytics only | Firebase web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics only | Google Analytics measurement ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Optional Firebase web app config field |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Optional Firebase web app config field |
| `VITE_FIREBASE_ANALYTICS_ENABLED` | No | Set to `false` to disable Analytics |
| `VITE_USE_EMULATOR` | No | Set to `true` to use Firebase emulators |
| `VITE_EMULATOR_AUTH_HOST` | No | Auth emulator URL (default: `http://localhost:9099`) |
| `VITE_EMULATOR_FIRESTORE_HOST` | No | Firestore emulator host:port (default: `localhost:8080`) |

## Tauri Commands (Rust)

Defined in `src-tauri/src/commands.rs`, exposed via `invoke()`:

| Command | Arguments | Description |
|---|---|---|
| `copy_to_clipboard` | `{ text: string }` | Copy text to system clipboard |
| `paste_to_active_app` | — | Simulate Cmd+V / Ctrl+V into active app |
| `register_hotkey` | `{ shortcut: string }` | Register global hotkey for quick launcher |
| `unregister_hotkey` | — | Remove all registered hotkeys |
| `toggle_quick_launcher` | — | Show/hide the quick launcher window |
| `show_main_window` | — | Show and focus the main window |
| `hide_main_window` | — | Hide main window to system tray |

## Data Models

Core types are in `src/types/index.ts`:

- **PromptRecipe** — Prompt with title, body, tags, folder, variables, version metadata
- **Folder** — Folder for organizing prompts
- **UserSettings** — Theme, hotkey, default action preferences
- **Workspace** — Workspace container (for multi-user sync)
- **WorkspaceMember / WorkspaceMembership** — Workspace roles and membership index records
- **WorkspaceInvite / WorkspaceDomainInvite** — Email and domain-based workspace invitations
- **PromptConflict** — Conflict between local and remote prompt versions
- **AuthUser / AuthResult** — Authentication types

## App Modes

Managed by `AppModeStore`:

| Mode | Description |
|---|---|
| `local` | Default. All data on device. No account needed. |
| `synced` | Signed in. Real-time Firestore sync active. |
| `offline-synced` | Signed in but offline. Queues changes for sync. |

## Correctness Properties (PBT)

Property-based tests verify core invariants including:

1. **Clipboard fallback preserves text** — For any string, when Tauri fails, browser clipboard receives the exact same string
2. **Variable extraction** — Unique placeholders are returned in first-appearance order
3. **Sidebar counts** — Filter, folder, and tag counts match non-archived prompt data
4. **Prompt filters and search** — Favorites and search filters include matches and exclude nonmatches
5. **Text counts and list navigation** — Text count helpers and arrow navigation behave over generated input
