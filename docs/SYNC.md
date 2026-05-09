# Sync

PromptDock is local-first. The app starts in local mode, stores prompts on the device, and does not initialize Firebase unless the user signs in, restores an existing auth session, or Firebase Analytics is configured.

Synced mode adds Firebase Auth and Cloud Firestore on top of the same prompt store and repository APIs. The UI keeps using `PromptStore`; the repository layer changes where prompt operations are persisted.

## Modes

| Mode | Meaning | Prompt storage |
|---|---|---|
| `local` | Default mode. No account or network required. | `LocalStorageBackend` in Tauri or `BrowserStorageBackend` in browser. |
| `synced` | Firebase user is active and Firestore prompt listener is running. | `PromptRepository` delegates prompt operations to `FirestoreBackend`. |
| `offline-synced` | A signed-in user is offline or the Firestore listener reports an unavailable state. | Firestore SDK local cache handles pending writes where possible. |

`AppModeStore` owns the current mode, signed-in user ID, online state, sync status, and `lastSyncedAt`.

## Main Pieces

| Piece | File | Role |
|---|---|---|
| App bootstrap | `src/App.tsx` | Chooses the local storage backend, initializes repositories/stores, restores auth, and reacts to mode changes. |
| Auth service | `src/services/auth-service.ts` | Signs users in or out, restores sessions, and bootstraps the user's Firestore workspace documents. |
| Sync service | `src/services/sync-service.ts` | Migrates local prompts, starts/stops Firestore snapshots, tracks online/offline state, and updates sync status. |
| Prompt repository | `src/repositories/prompt-repository.ts` | Uses local storage by default, then forwards prompt CRUD to Firestore when a delegate is installed. |
| Firestore backend | `src/repositories/firestore-backend.ts` | Implements prompt CRUD against `workspaces/{workspaceId}/prompts`. |
| Conflict service | `src/services/conflict-service.ts` | Tracks in-memory local/remote prompt conflicts detected by sync. |

## Startup

1. `initializeApp()` detects the runtime:
   - Tauri desktop uses `LocalStorageBackend`, backed by Tauri Store JSON files.
   - Browser runtime uses `BrowserStorageBackend`, backed by `window.localStorage`.
2. `PromptRepository` and `SettingsRepository` are created around that local backend.
3. `PromptStore`, `SettingsStore`, and `AppModeStore` are initialized.
4. Seed prompts are inserted into the `local` workspace if needed.
5. Prompts and settings load from local storage.
6. `AuthService.restoreSession()` may find an existing Firebase user. If it does, `AppModeStore.userId` is set and mode becomes `synced`.

Firebase SDK imports are dynamic. Local-only startup does not call `getFirebaseAuth()` or `getFirebaseFirestore()`.

## Workflow Overview

### Local Startup

```mermaid
flowchart TD
  A["App starts"] --> B{"Tauri runtime?"}
  B -->|"Yes"| C["Create LocalStorageBackend"]
  B -->|"No"| D["Create BrowserStorageBackend"]
  C --> E["Create repositories"]
  D --> E
  E --> F["Initialize Zustand stores"]
  F --> G["Seed default prompts if local workspace is empty"]
  G --> H["Load prompts and settings"]
  H --> I{"Existing Firebase auth session?"}
  I -->|"No"| J["Stay in local mode"]
  I -->|"Yes"| K["Set userId and mode = synced"]
  K --> L["Run local-to-synced workflow"]
```

### Local To Synced

```mermaid
sequenceDiagram
  participant User
  participant Settings as SettingsScreen
  participant Auth as AuthService
  participant Mode as AppModeStore
  participant App as App.tsx subscriber
  participant Sync as SyncService
  participant Repo as PromptRepository
  participant Firestore
  participant Store as PromptStore

  User->>Settings: Sign in or sign up
  Settings->>Auth: signIn(), signUp(), or signInWithGoogle()
  Auth->>Firestore: Bootstrap user, workspace, and owner membership
  Auth-->>Settings: AuthResult with Firebase UID
  Settings->>Mode: setUserId(uid), setMode("synced")
  Mode-->>App: Mode changed to synced
  App->>Store: setActiveWorkspaceId(uid)
  App->>Sync: transitionToSynced(uid, uid, currentPrompts, "migrate")
  Sync->>Firestore: Copy local prompts that do not already exist remotely
  Sync->>Firestore: Start onSnapshot listener
  Firestore-->>Sync: Prompt snapshot
  Sync-->>Store: Replace prompts with remote list
  Sync-->>Mode: setSyncStatus("synced")
  App->>Repo: setFirestoreDelegate(firestoreBackend)
```

## Switching From Local To Synced

The normal Settings flow is sign-in or sign-up. The visual Sync option cards in Settings are derived from `AppModeStore` and are not the control that performs the switch.

1. The user signs in with email/password or Google from `SettingsScreen`.
2. `AuthService` authenticates with Firebase Auth.
3. On auth success, `AuthService` bootstraps these Firestore documents:
   - `/users/{uid}`
   - `/workspaces/{uid}`
   - `/workspaces/{uid}/members/{uid}`
4. The UI stores the Firebase UID in `AppModeStore.userId` and sets `AppModeStore.mode` to `synced`.
5. `App.tsx` is subscribed to `AppModeStore` mode changes. When it sees `synced`, it uses the Firebase UID as the default workspace ID.
6. `PromptStore.activeWorkspaceId` and `settings.activeWorkspaceId` are updated to that workspace ID.
7. `SyncService` is created with callbacks:
   - remote prompt snapshots replace `PromptStore.prompts`
   - detected conflicts are passed to `ConflictService`
8. `SyncService.transitionToSynced(userId, workspaceId, currentPrompts, 'migrate')` runs.
9. After the transition completes, `PromptRepository.setFirestoreDelegate(firestoreBackend)` makes future prompt operations go to Firestore.

## Local Prompt Migration

By default, `initializeApp()` passes `syncMigrationChoice = 'migrate'`. During transition, `SyncService` receives the current prompt list from `PromptStore` and copies those prompts into Firestore.

For each local prompt:

1. It checks `workspaces/{uid}/prompts/{prompt.id}`.
2. If a document with that prompt ID already exists, migration skips it.
3. Otherwise it writes the prompt with:
   - the same prompt ID
   - `workspaceId` changed to the Firebase UID workspace
   - `createdBy` changed to the Firebase UID
   - `Date` values converted to Firestore timestamps
   - the existing prompt `version`

Migration copies data; it does not delete local prompts from local storage. After sign-out, the app returns to the `local` workspace and reloads the local prompt list.

## Firestore Listener

`SyncService` starts an `onSnapshot` listener on:

```text
workspaces/{workspaceId}/prompts
```

The query filters documents whose `workspaceId` field matches the current workspace ID. Each snapshot is converted back to `PromptRecipe` objects, then:

1. conflicts are detected against the previous local snapshot,
2. `localPromptsSnapshot` is replaced with the remote list,
3. `PromptStore.prompts` is replaced with the remote list,
4. sync status becomes `synced` when the app is in synced mode.

This means Firestore snapshots are the source of truth for the visible prompt list in synced mode.

## Prompt CRUD In Synced Mode

Components keep calling `PromptStore` actions such as `createPrompt`, `updatePrompt`, `archivePrompt`, and `toggleFavorite`.

`PromptStore` still delegates to `PromptRepository`, but after sync transition `PromptRepository` has a Firestore delegate. Its prompt methods forward to `FirestoreBackend`:

- `create()` uses `addDoc()` under `workspaces/{workspaceId}/prompts`.
- `getAll()` queries prompt documents by workspace ID.
- `update()` writes changed fields, sets `updatedAt` to `serverTimestamp()`, and increments `version`.
- `softDelete()` marks a prompt archived.
- `restore()`, `duplicate()`, and `toggleFavorite()` use the same Firestore path.

The store updates optimistically from the operation result, and the snapshot listener can later replace the store with the authoritative Firestore list.

### Synced Prompt Write

```mermaid
sequenceDiagram
  participant UI as PromptEditor or Library UI
  participant Store as PromptStore
  participant Repo as PromptRepository
  participant Backend as FirestoreBackend
  participant Firestore
  participant Sync as SyncService onSnapshot

  UI->>Store: createPrompt(), updatePrompt(), archivePrompt(), etc.
  Store->>Repo: Same repository method
  Repo->>Backend: Forward because Firestore delegate is active
  Backend->>Firestore: Write prompt document
  Firestore-->>Backend: Operation result
  Backend-->>Repo: PromptRecipe
  Repo-->>Store: PromptRecipe
  Store-->>UI: Immediate state update
  Firestore-->>Sync: Snapshot with authoritative prompt list
  Sync-->>Store: Replace prompts with snapshot list
```

## Offline And Reconnection

Firestore initializes with `persistentLocalCache()`, so the Firebase SDK can cache remote data and pending writes.

`SyncService` also listens to browser `online` and `offline` events:

- On offline, mode becomes `offline-synced`, `isOnline` becomes `false`, and sync status becomes `offline`.
- On online, if the app was `offline-synced`, mode returns to `synced`, sync status becomes `syncing`, and then becomes `synced` after a short delay.

The code relies on the Firestore SDK to flush pending writes and emit updated snapshots after reconnection.

### Offline And Online

```mermaid
stateDiagram-v2
  [*] --> local
  local --> synced: sign in and transition succeeds
  synced --> offline_synced: browser offline event or Firestore unavailable
  offline_synced --> synced: browser online event
  synced --> local: sign out
  offline_synced --> local: sign out

  state synced {
    [*] --> listening
    listening: Firestore onSnapshot active
  }

  state offline_synced {
    [*] --> cached
    cached: Firestore local cache and pending writes
  }
```

## Sign-Out

When the user signs out:

1. `AuthService.signOut()` signs out of Firebase Auth.
2. `AppModeStore.userId` is cleared and mode becomes `local`.
3. `App.tsx` tears down `SyncService`.
4. Firestore snapshot and online/offline listeners are removed.
5. `PromptRepository.setFirestoreDelegate(null)` restores local storage persistence.
6. `PromptStore.activeWorkspaceId` and `settings.activeWorkspaceId` return to `local`.
7. In-memory conflicts are cleared.
8. Local prompts reload from local storage.

### Sign-Out Workflow

```mermaid
flowchart TD
  A["User clicks Sign Out"] --> B["AuthService.signOut()"]
  B --> C["Clear AppModeStore.userId"]
  C --> D["Set mode = local"]
  D --> E["App.tsx mode subscriber runs local teardown"]
  E --> F["SyncService.dispose()"]
  F --> G["Stop Firestore snapshot listener"]
  G --> H["Remove online/offline listeners"]
  H --> I["PromptRepository.setFirestoreDelegate(null)"]
  I --> J["Set activeWorkspaceId = local"]
  J --> K["Clear in-memory conflicts"]
  K --> L["Reload local prompts from local storage"]
```

## What Sync Covers Today

Currently synced:

- prompt recipes in `workspaces/{workspaceId}/prompts`
- user-created folders in `workspaces/{workspaceId}/folders`
- auth session state through Firebase Auth
- the default personal workspace and owner membership bootstrap

Not fully synced today:

- settings, despite the Firestore rules including a `/settings/{userId}` path
- conflict records, which are tracked in memory by `ConflictService`
- multiple workspace selection beyond the current default of `workspaceId = userId`

## Important Caveats

- The Settings Sync option buttons are display-only right now; sign-in/sign-up is what triggers synced mode.
- The onboarding guest cloud path is not the main production path. It expects a `syncService` prop, but the app normally creates `SyncService` in response to entering synced mode.
- Migration skips existing remote prompt IDs instead of merging or overwriting them.
- Remote snapshots replace the whole visible prompt list in synced mode.
- Local data remains available after sign-out because migration copies local prompts rather than moving them.
