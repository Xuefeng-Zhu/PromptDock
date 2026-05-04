# PromptDock Architecture

PromptDock is a local-first prompt recipe manager with two runtime shells:
a Tauri desktop app and a browser-compatible React app. The product surface is
React, the durable state flows through repository interfaces, and native
capabilities are isolated behind small TypeScript utilities and Rust Tauri
commands.

This document maps the repo as it exists today: main modules, data flow, state
ownership, API boundaries, and a practical reading path for new contributors.

## System Shape

```text
src/main.tsx
  -> App                         main window / browser runtime
  -> QuickLauncherApp             quick-launcher Tauri window

initializeApp()
  -> runtime detection
  -> LocalStorageBackend or BrowserStorageBackend
  -> PromptRepository + SettingsRepository
  -> PromptStore + SettingsStore + AppModeStore
  -> optional AuthService, SyncService, ConflictService, Analytics

React screens and components
  -> controller hooks
  -> Zustand stores
  -> repositories
  -> storage backend or Firestore delegate

Platform boundaries
  -> utils/clipboard.ts, utils/hotkey.ts, utils/window.ts, utils/file-dialog.ts
  -> src-tauri/src/commands.rs
  -> firebase/config.ts dynamic Firebase imports
```

The main dependency direction is intentionally one-way:

```text
UI components
  -> hooks/controllers
  -> Zustand stores
  -> repositories
  -> storage backends
```

Services sit beside that flow. Some services are pure domain logic
(`VariableParser`, `PromptRenderer`, `SearchEngine`, `ImportExportService`);
others wrap external systems (`AuthService`, `SyncService`,
`FirestoreBackend`, analytics).

## Runtime Entry Points

| Runtime | Entry point | What it renders | Notes |
|---|---|---|---|
| Browser or main Tauri window | `src/main.tsx` -> `src/App.tsx` | `AppShell` | Full library, editor, settings, sync, overlays, and toast UI. |
| Tauri quick-launcher window | `src/main.tsx` -> `src/screens/QuickLauncherApp.tsx` | `QuickLauncherWindow` | Separate webview with its own store instances, backed by the same storage; skips seeding and hotkey registration. |
| Native desktop process | `src-tauri/src/main.rs` -> `src-tauri/src/lib.rs` | Tauri windows and commands | Registers plugins, tray behavior, global shortcut, and command handlers. |

`src/main.tsx` asks Tauri for the current window label. If the label is
`quick-launcher`, it mounts the launcher app. Otherwise it mounts the full app.
Outside Tauri, the label lookup fails safely and the browser renders `App`.

`initializeApp()` in `src/App.tsx` is the shared bootstrap. It is idempotent
within a webview and does this work:

1. Detects Tauri via `isTauriRuntime()`.
2. Initializes `LocalStorageBackend` in desktop or `BrowserStorageBackend` in a
   regular browser.
3. Creates `PromptRepository` and `SettingsRepository`.
4. Initializes the singleton Zustand stores.
5. Seeds default prompts in the local workspace when requested.
6. Loads prompts and settings into the stores.
7. Registers the configured global hotkey in desktop mode.
8. Creates background auth, sync, conflict, and analytics services when enabled.
9. Restores Firebase auth and moves the app into synced mode if a session exists.

## Module Map

| Area | Files | Responsibility |
|---|---|---|
| Bootstrap | `src/main.tsx`, `src/App.tsx` | Runtime routing, backend selection, store/repository initialization, seeding, auth restore, hotkey setup. |
| App shell | `src/components/app-shell/*`, `src/hooks/use-app-shell-controller.ts`, `src/hooks/app-shell/*` | Screen routing, sidebar/top bar orchestration, CRUD handlers, command palette flow, conflict actions, navigation guards. |
| Feature UI | `src/components/library/*`, `src/components/prompt-editor/*`, `src/components/settings/*`, `src/components/sidebar/*`, `src/components/prompt-search/*`, `src/components/variable-fill/*`, `src/components/prompt-inspector/*` | User-facing views and reusable feature components. |
| Quick launcher | `src/screens/QuickLauncherApp.tsx`, `src/screens/QuickLauncherWindow.tsx`, `src/screens/quick-launcher/*` | Search-focused overlay window, keyboard navigation, variable fill, copy/paste, close-on-action behavior. |
| State stores | `src/stores/*` | Prompt, settings, app mode, and toast state. Prompt/settings/app-mode stores use factory plus singleton initialization. |
| Repositories | `src/repositories/*` | Durable data access contracts, local/browser storage-backed repositories, Firestore prompt repository delegate. |
| Services | `src/services/*` | Auth, sync, conflict tracking, import/export, search, variable parsing, rendering, analytics, default seed data. |
| Firebase | `src/firebase/config.ts` | Lazy Firebase app, analytics, auth, Firestore, emulator config, and test reset. |
| Platform utils | `src/utils/clipboard.ts`, `src/utils/hotkey.ts`, `src/utils/window.ts`, `src/utils/file-dialog.ts`, `src/utils/runtime.ts` | Browser/Tauri boundary wrappers and fallbacks. |
| Domain types | `src/types/index.ts` | Shared app models and result types. |
| Native layer | `src-tauri/src/*`, `src-tauri/tauri.conf.json` | Tauri commands, plugins, tray, windows, global shortcut, clipboard, paste simulation. |
| Tests | `src/**/__tests__/*`, `src/setup.test.ts`, `vitest.config.ts` | Unit, component, integration, and property-based coverage. |

## Core Domain Model

`PromptRecipe` in `src/types/index.ts` is the central record:

| Field group | Fields | Purpose |
|---|---|---|
| Identity | `id`, `workspaceId` | Stable prompt ID and workspace scope. Local mode uses the `local` workspace; synced mode uses the user workspace ID. |
| Content | `title`, `description`, `body` | Prompt text. `body` can contain `{{variable}}` placeholders. |
| Organization | `tags`, `folderId`, `favorite` | Tags are inline strings. Folders are referenced by ID. |
| Lifecycle | `archived`, `archivedAt`, `lastUsedAt` | Delete/archive is soft delete. Prompt execution updates use time. |
| Sync metadata | `createdAt`, `updatedAt`, `createdBy`, `version` | Used for ordering, local writes, migration, and conflict detection. |

Other important models:

| Type | Role |
|---|---|
| `Folder` | Folder ID/name/timestamps. Current UI-created folders are persisted by `utils/folder-storage.ts`; prompt records persist only the `folderId`. |
| `UserSettings` | Theme, global hotkey, default copy/paste action, active workspace ID. |
| `Workspace` and `WorkspaceMember` | Local workspace metadata and Firestore authorization shape. |
| `PromptConflict` | In-memory local/remote prompt versions requiring resolution. |
| `AuthUser` and `AuthResult` | App-level Firebase auth result types with mapped errors. |

Important prompt invariants live in `PromptRepository` and `FirestoreBackend`:

- Local create generates `id`, `createdAt`, `updatedAt`, `createdBy: 'local'`,
  and `version: 1`.
- Local update preserves `id`, refreshes `updatedAt`, and increments `version`.
- Archive/restore toggles `archived` and `archivedAt`; archived prompts remain
  in durable storage.
- Duplicate creates a new ID, prefixes the title with `Copy of`, clears
  archive/use state, clears favorite, and resets `version`.
- Synced prompt CRUD is delegated from `PromptRepository` to `FirestoreBackend`
  after `SyncService` activates synced mode.

## State Management

The app uses Zustand. Three stores are initialized during bootstrap and expose
both a factory for tests and a singleton hook for production:

| Store | File | Owns |
|---|---|---|
| `PromptStore` | `src/stores/prompt-store.ts` | Loaded prompt list, loading state, active workspace, selected prompt ID, basic query/filter state, prompt CRUD actions. |
| `SettingsStore` | `src/stores/settings-store.ts` | Loaded `UserSettings`, settings loading state, settings update action. |
| `AppModeStore` | `src/stores/app-mode-store.ts` | `local`, `synced`, or `offline-synced` mode, current user ID, online flag, sync status, last synced timestamp. |
| `ToastStore` | `src/stores/toast-store.ts` | Transient toast queue. This store is created directly because it has no repository dependency. |

Navigation and screen state are not in Zustand. `useShellNavigation()` owns
the current screen, selected prompt, command palette state, active sidebar item,
active filter object, local folder list, variable fill prompt ID, and editor
dirty guard. That keeps route-like UI state local to the app shell.

Derived data is calculated in `useLibraryData()`:

- Filtered prompts via `utils/library-filtering.ts`.
- Sidebar counts via `utils/sidebar-counts.ts`.
- Folder list by combining persisted user folders with prompt `folderId` values.
- Available tags from loaded prompt tags.
- Selected prompt, selected folder, and extracted variables.
- Variable-fill prompt and variables.

The key ownership rule:

```text
Repository cache = durable data helper, not observable UI state.
Zustand prompt list = observable UI state, not durable storage.
```

Store actions call repository methods first, then merge the saved result into
Zustand. Components should treat store state as the React-facing source of truth
and repository return values as persistence-confirmed records.

## Persistence Boundaries

`src/repositories/interfaces.ts` defines the main internal data contracts.

### Storage Backends

`IStorageBackend` is the local persistence boundary:

```text
readPrompts/writePrompts
readFolders/writeFolders
readSettings/writeSettings
readWorkspace/writeWorkspace
```

Implementations:

| Backend | Runtime | Storage |
|---|---|---|
| `LocalStorageBackend` | Tauri desktop | Tauri Store plugin JSON files: `prompts.json`, `folders.json`, `settings.json`, `workspace.json`. |
| `BrowserStorageBackend` | Browser | `window.localStorage` keys under `promptdock:*`. |

Both backends revive dates into `Date` objects. The Tauri backend also attempts
basic recovery if a store file cannot be read or deserialized.

### Repositories

| Repository | Boundary |
|---|---|
| `PromptRepository` | Implements `IPromptRepository`, keeps a lazy in-memory cache, persists every local mutation through `IStorageBackend`, filters by workspace, and forwards to Firestore when a delegate is installed. |
| `SettingsRepository` | Implements `ISettingsRepository`, lazily caches settings and persists updates through `IStorageBackend`. |
| `WorkspaceRepository` | Local single-workspace repository around `LocalStorageBackend`. |
| `FirestoreBackend` | Implements `IPromptRepository` for `/workspaces/{workspaceId}/prompts`. It is used as the synced-mode prompt delegate. |

The repository layer is the place to enforce durable prompt invariants. UI code
should not write directly to storage backends, Firestore, or localStorage for
prompt records.

### Current Folder Note

The storage backend interface supports folders, but the current app shell reads
and creates UI folders through `src/utils/folder-storage.ts`, a small
localStorage bridge. Prompt records persist their `folderId`; `useLibraryData()`
derives the displayed folder list from both user-created folders and prompt
folder IDs. If you add richer folder features or folder sync, start by unifying
folder ownership behind a repository.

## External API Boundaries

PromptDock does not expose an HTTP API. Its API boundaries are internal
interfaces, Tauri commands, Firebase SDK calls, browser APIs, and the import
JSON format.

### Tauri Commands

Rust commands are defined in `src-tauri/src/commands.rs` and registered in
`src-tauri/src/lib.rs`.

| Command | TypeScript wrapper | Responsibility |
|---|---|---|
| `copy_to_clipboard` | `copyToClipboard()` in `src/utils/clipboard.ts` | Write text to the system clipboard, with browser fallback. |
| `paste_to_active_app` | `pasteToActiveApp()` in `src/utils/clipboard.ts` | Copy first, hide PromptDock, focus the previous app where possible, and simulate Cmd/Ctrl+V. |
| `register_hotkey` / `unregister_hotkey` | `registerHotkey()` in `src/utils/hotkey.ts` | Manage the global shortcut that toggles the launcher. |
| `toggle_quick_launcher` | Direct invoke from launcher controller and Rust hotkey callback | Show/hide the quick-launcher window. |
| `show_main_window` / `hide_main_window` | `hideMainWindow()` wraps hide only today | Tray/window visibility controls. |

Tauri-specific calls should stay behind utilities unless a component is already
part of a Tauri-only surface. Utilities either no-op outside Tauri or provide a
browser fallback.

### Firebase

Firebase imports are lazy and centralized in `src/firebase/config.ts`.

| Caller | Firebase surface |
|---|---|
| `AuthService` | Auth sign-up, sign-in, Google sign-in, sign-out, auth session restore, password reset, and bootstrap of `/users/{uid}`, `/workspaces/{uid}`, `/workspaces/{uid}/members/{uid}`. |
| `SyncService` | Firestore prompt snapshot listener, local prompt migration, online/offline mode transitions, conflict detection callback. |
| `FirestoreBackend` | Prompt CRUD against `/workspaces/{workspaceId}/prompts`. |
| `analytics-service.ts` | Optional Firebase Analytics event tracking when configured and supported. |

The default synced workspace ID is currently the Firebase user ID. Prompt CRUD
switches to Firestore by calling `PromptRepository.setFirestoreDelegate()`.
Settings still flow through `SettingsRepository`; the current synced-mode
wiring is primarily prompt sync.

### Browser APIs

Browser fallbacks are used for:

- `window.localStorage` storage in browser runtime.
- Clipboard writes through `navigator.clipboard.writeText()` and a textarea
  fallback.
- File import/export through file inputs, `showSaveFilePicker()` when
  available, or an object URL download.
- Online/offline events for sync status.
- Onboarding and UI folder flags in localStorage.

## Primary Data Flows

### Startup

```text
src/main.tsx
  -> detect Tauri window label
  -> App or QuickLauncherApp
  -> initializeApp(options)
  -> choose storage backend
  -> create repositories
  -> init Zustand stores
  -> seed/load prompts and settings
  -> register hotkey if requested
  -> create services
  -> restore auth session if requested
  -> render shell
```

Main `App` wraps `AppShell` with `AppModeProvider`, `ThemeManager`, and
`ErrorBoundary`. The launcher wraps `QuickLauncherWindow` with `ThemeManager`
and `ErrorBoundary`.

### Prompt Create And Edit

```text
PromptEditor
  -> useAppShellController()
  -> usePromptCrudActions().handleEditorSave()
  -> PromptStore.createPrompt() or updatePrompt()
  -> PromptRepository.create() or update()
  -> LocalStorageBackend / BrowserStorageBackend / FirestoreBackend
  -> saved PromptRecipe
  -> PromptStore updates prompt list
  -> React rerenders library/editor/inspector
```

`usePromptCrudActions()` decides local versus synced metadata for new prompts:
local prompts use workspace `local` and creator `local`; synced prompts use the
active workspace ID and current user ID.

### Library Search And Filtering

```text
TopBar search / Sidebar / Filter popover
  -> navigation/filter state
  -> useLibraryData()
  -> filterPrompts(), sidebar counts, tag/folder derivation
  -> LibraryScreen and Sidebar props
```

The command palette and quick launcher use search-specific hooks and
`SearchEngine`-style ranking across title, tags, description, and body. Library
filters are derived in memory from the loaded prompt collection.

### Prompt Execution

```text
User selects prompt
  -> extractVariables(body)
  -> if variables exist: VariableFillModal
  -> renderPromptTemplate()
  -> usePromptExecution()
  -> copyToClipboard() or pasteToActiveApp()
  -> PromptStore.markPromptUsed()
  -> analytics action event
```

Paste always copies first. In browser mode, paste cannot target another app, so
the text remains on the clipboard and the result is reported as copied.

### Quick Launcher

```text
Global hotkey
  -> Rust toggle_quick_launcher
  -> quick-launcher webview becomes visible
  -> useQuickLauncherController()
  -> loadPrompts() on focus/visibility
  -> search results + highlighted index
  -> copy/paste and hide window
```

The launcher has its own JS context and store instances. It refreshes prompts
from shared persistence when focused or when the document becomes visible.

### Sync Transition

```text
Auth success or restored session
  -> AppModeStore.userId = uid
  -> AppModeStore.mode = synced
  -> App.tsx mode subscription creates SyncService
  -> active workspace becomes uid
  -> SyncService.transitionToSynced()
  -> optional local prompt migration
  -> Firestore onSnapshot listener
  -> PromptRepository.setFirestoreDelegate(FirestoreBackend)
  -> remote snapshots replace PromptStore.prompts
```

When the app returns to local mode, `SyncService` disposes listeners, the
Firestore delegate is cleared, active workspace returns to `local`, conflicts
are cleared, and local prompts are reloaded.

Conflict detection compares local and remote prompt versions, timestamps, title,
and body. `ConflictService` stores unresolved conflicts in memory and exposes a
subscription used by `useConflictController()`.

### Settings

```text
SettingsScreen
  -> useSettingsActions()
  -> SettingsStore.updateSettings()
  -> SettingsRepository.update()
  -> IStorageBackend.writeSettings()
```

Theme changes are applied by `ThemeManager`. Hotkey changes first call the
Tauri hotkey command through `registerHotkey()` and then persist the setting.
The hotkey settings section is hidden in browser mode.

### Import And Export

```text
Settings import/export card
  -> usePromptImportExport()
  -> ImportExportService
  -> file-dialog utility
  -> PromptStore.createPrompt() or updatePrompt()
```

Export writes non-archived prompts to schema version `1.0`. Import validates the
JSON shape, detects duplicates by title/body, and either skips, overwrites, or
creates prompts in the current target workspace.

## Where A New Developer Should Start

Read in this order:

1. `README.md` for product intent, commands, environment variables, and docs.
2. `package.json`, `vite.config.ts`, and `src-tauri/tauri.conf.json` for the
   build/runtime shape.
3. `src/main.tsx` and `src/App.tsx` to understand bootstrapping, runtime
   selection, singleton store initialization, sync wiring, and quick-launcher
   routing.
4. `src/types/index.ts`, `src/repositories/interfaces.ts`, and
   `src/services/interfaces.ts` for the core contracts.
5. `src/components/app-shell/AppShell.tsx`,
   `src/hooks/use-app-shell-controller.ts`, and `src/hooks/app-shell/*` for how
   user actions become store/repository calls.
6. `src/stores/prompt-store.ts`, `src/stores/settings-store.ts`, and
   `src/stores/app-mode-store.ts` for state ownership.
7. `src/repositories/prompt-repository.ts`,
   `src/repositories/local-storage-backend.ts`,
   `src/repositories/browser-storage-backend.ts`, and
   `src/repositories/firestore-backend.ts` for persistence behavior.
8. `src/services/sync-service.ts`, `src/services/auth-service.ts`,
   `src/services/conflict-service.ts`, and `src/firebase/config.ts` for synced
   mode.
9. `src/utils/clipboard.ts`, `src/utils/hotkey.ts`, `src/utils/window.ts`, and
   `src-tauri/src/commands.rs` for desktop integration.
10. `src/screens/QuickLauncherApp.tsx`,
    `src/screens/quick-launcher/useQuickLauncherController.ts`, and
    `src/components/prompt-search/*` for launcher/search behavior.

Useful companion docs:

- `docs/API.md` for internal interfaces, Tauri command signatures, Firestore
  paths, and import/export schema.
- `docs/SYNC.md` for deeper sync behavior and caveats.
- `docs/DEVELOPMENT.md` for workflow conventions.
- `docs/TESTING.md` for test strategy and commands.

## Common Change Locations

| Change | Start here | Then check |
|---|---|---|
| Add a prompt CRUD behavior | `src/hooks/app-shell/use-prompt-crud-actions.ts` | `PromptStore`, `PromptRepository`, component tests, repository/store tests. |
| Add prompt fields | `src/types/index.ts` | repository serializers, Firestore converters, import/export schema, editor UI, tests, Firestore rules if synced. |
| Add a library filter | `src/utils/library-filtering.ts` | `useLibraryData()`, filter popover components, sidebar counts, property tests. |
| Add a setting | `UserSettings` in `src/types/index.ts` | default settings in stores/backends, settings UI cards, settings tests. |
| Change copy/paste behavior | `src/hooks/use-prompt-execution.ts` | `src/utils/clipboard.ts`, `src-tauri/src/commands.rs`, clipboard property tests. |
| Change the global hotkey | `src/utils/hotkey.ts` | `src-tauri/src/commands.rs`, settings hotkey UI, runtime tests. |
| Change sync behavior | `src/services/sync-service.ts` | `AuthService`, `FirestoreBackend`, Firestore rules/indexes, sync integration tests. |
| Add native capability | `src-tauri/src/commands.rs` | `src-tauri/src/lib.rs`, `tauri.conf.json` capabilities, TypeScript utility wrapper. |
| Add import/export fields | `src/services/import-export.ts` | settings import/export UI, JSON schema docs, tests. |
| Adjust quick launcher UX | `src/screens/quick-launcher/useQuickLauncherController.ts` | prompt search components, keyboard navigation tests. |

## Testing Landmarks

- Store tests live in `src/stores/__tests__/`.
- Repository/backend tests live in `src/repositories/__tests__/`.
- Service tests live in `src/services/__tests__/`.
- Component and shell behavior tests live in `src/components/__tests__/` and
  `src/screens/__tests__/`.
- Property-based tests cover clipboard fallback, search/filter behavior,
  variable extraction/fill conditions, sidebar counts, text counts, and keyboard
  navigation invariants.

Run the full suite with:

```bash
npm test
```

For architecture-sensitive changes, also run:

```bash
npm run build
```
