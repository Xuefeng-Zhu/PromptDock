# AGENTS.md — PromptDock

## Project Overview

PromptDock is a local-first, cross-platform prompt recipe manager built with Tauri 2 + React 19 + TypeScript 6 + Vite 8 + Zustand + Tailwind CSS v4. It also runs in a regular browser (no Tauri required) using a localStorage fallback.

Users create, organize, and reuse AI prompt templates with `{{variable}}` placeholders. A global hotkey opens a quick launcher overlay for rapid search-and-paste into any application.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19.2.6, TypeScript 6.0.3, Vite 8.0.12 |
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
│  VariableParser, PromptRenderer, PromptJson, Analytics  │
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
│   ├── interfaces.ts          # Service interfaces
│   ├── auth-service.ts        # Firebase Auth (sign-in/up/out/restore)
│   ├── app-sync-lifecycle.ts  # Auth restore and sync lifecycle orchestration
│   ├── sync-service.ts        # Firestore real-time sync
│   ├── conflict-service.ts    # Conflict detection and resolution
│   ├── import-export.ts       # JSON import/export with duplicate detection
│   ├── prompt-json.ts         # Single-prompt JSON form-fill parser
│   ├── analytics-service.ts   # Optional Firebase Analytics events
│   ├── search-engine.ts       # Local prompt search
│   ├── variable-parser.ts     # {{variable}} extraction
│   ├── prompt-renderer.ts     # Template variable substitution
│   └── seed-data.ts           # Default prompts for first launch
├── contexts/                  # React context providers
│   └── AppModeProvider.tsx    # App mode context
├── firebase/                  # Firebase configuration
│   └── config.ts              # Lazy Firebase initialization
├── types/                     # TypeScript type definitions
│   └── index.ts               # All shared types
├── utils/                     # Utility functions
│   ├── clipboard.ts           # Tauri clipboard with browser fallback
│   ├── hotkey.ts              # Tauri hotkey registration
│   ├── theme.ts               # CSS theme application (light/dark/system)
│   ├── file-dialog.ts         # File save/open (browser APIs)
│   ├── workspace-domain.ts    # Domain invite validation/helpers
│   ├── folder-names.ts        # Folder name normalization
│   ├── runtime.ts             # Browser/Tauri runtime detection
│   ├── window.ts              # Tauri window fallback helpers
│   └── sidebar-counts.ts      # Sidebar count computations
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
