# AGENTS.md — `src/repositories/`

Data access layer. Three storage backends (Tauri / Browser / Firestore) plug in behind two interfaces. Repositories mediate between Zustand stores and the backends — **components never see this folder**.

## INVENTORY

| File | Purpose |
|---|---|
| `interfaces.ts` | `IStorageBackend`, `IPromptRepository`, `IFolderRepository`, `IWorkspaceRepository`, `ISettingsRepository` |
| `local-storage-backend.ts` | Tauri Store plugin backend — one JSON file per domain |
| `browser-storage-backend.ts` | `window.localStorage` backend — same shape as Tauri |
| `firestore-backend.ts` | Implements `IPromptRepository` + `IFolderRepository` (NOT `IStorageBackend`); workspace-scoped, dynamic-imports Firebase |
| `firestore-timestamps.ts` | Plain-shape Timestamp helpers (test-friendly) |
| `workspace-firestore-converters.ts` | Firestore doc shapes + `to*` converters for Workspace / Member / Membership / Invite / DomainInvite |
| `prompt-repository.ts` | In-memory cache + optional Firestore delegate; full-collection rewrite on every mutation |
| `folder-repository.ts` | Same pattern as prompt repo, with `normalizeFolderName` for uniqueness |
| `settings-repository.ts` | Local-only (no Firestore sync); defensive copies returned |
| `workspace-repository.ts` | Hybrid: local single-workspace read/write + direct Firestore for member/invite/domain ops |

## `IStorageBackend` CONTRACT (9 METHODS)

```
initialize()
readPrompts() / writePrompts(prompts)
readFolders() / writeFolders(folders)
readSettings() / writeSettings(settings)
readWorkspace() / writeWorkspace(workspace)
```

Implemented **only** by `LocalStorageBackend` and `BrowserStorageBackend`. `FirestoreBackend` does **not** implement `IStorageBackend` — it's a separate repository-level contract. When adding a method to `IStorageBackend`, update both implementations.

## BACKEND SELECTION (`App.tsx:114-122`)

```ts
const isTauri = isTauriRuntime();    // src/utils/runtime.ts
backend = isTauri ? new LocalStorageBackend() : new BrowserStorageBackend();
await backend.initialize();
```

The same `backend` is injected into all four repositories. There is no env-var override; runtime detection is the single source of truth.

## FIRESTORE DELEGATE LIFECYCLE

`FirestoreBackend` is **not** selected at startup. It is installed dynamically by `SyncService` when the user signs in:

1. `SyncService.transitionToSynced()` (sync-service.ts:107-108) does `await import('../repositories/firestore-backend')` and constructs `new FirestoreBackend(workspaceId)`.
2. `SyncService.getFirestoreBackend()` exposes the instance (or `null` while local).
3. `AppSyncLifecycle.wireFirestoreDelegates()` (app-sync-lifecycle.ts:309-318) calls `promptRepository.setFirestoreDelegate(target)` and `folderRepository.setFirestoreDelegate(target)`.
4. On sign-out or workspace switch, `clearFirestoreDelegates()` passes `null` and the repositories revert to the `IStorageBackend` path.

**`WorkspaceRepository` does NOT use the delegate pattern.** Its synced methods call Firestore directly via dynamic `await import('firebase/firestore')` and bypass the backend entirely.

## BLOCKED-DELEGATE FALLBACK

During an in-flight workspace switch, the delegate may be `null` for a brief window. `AppSyncLifecycle` substitutes `createBlockedFirestoreDelegate(workspaceId)` — every method returns a rejected promise with "Workspace X is still syncing" so in-flight UI mutations fail fast instead of writing to stale storage.

## DELEGATING REPOSITORY PATTERN (`prompt-repository.ts:17-55`)

```
class PromptRepository {
  private prompts: PromptRecipe[] = [];   // in-memory cache
  private loaded = false;
  private firestoreDelegate: IPromptRepository | null = null;

  constructor(private readonly backend: IStorageBackend) {}

  setFirestoreDelegate(delegate) { this.firestoreDelegate = delegate; }
  hasFirestoreDelegate() { return this.firestoreDelegate !== null; }

  private ensureLoaded() {                 // lazy hydration
    if (!this.loaded) {
      this.prompts = await this.backend.readPrompts();
      this.loaded = true;
    }
  }
  private persist() {                       // full-collection rewrite
    await this.backend.writePrompts(this.prompts);
  }

  // every public method: delegate ? delegate.x(...) : (ensureLoaded, mutate cache, persist)
}
```

Same skeleton in `folder-repository.ts` and `settings-repository.ts`.

Notable specifics:

- **`nextMutationDate(prevUpdatedAt)`** (`prompt-repository.ts:62-67`) — guarantees strictly increasing `updatedAt` even when `Date.now()` returns the same millisecond (sync conflict tests depend on this).
- **Versioning** — local mode bumps `version` manually; Firestore uses `increment(1)`.
- **Defensive copies** — `SettingsRepository.get()` and folder `getAllFolders` return spread copies so callers cannot mutate the cache.
- **Folder id stability** — `createUniqueFolderId` normalizes the name and appends `-2`, `-3`, … on collision.
- **Folder uniqueness** — both repos use `normalizeFolderName()` (from `utils/folder-names`) for case/whitespace-insensitive duplicate detection.

## BACKEND QUIRKS

### Tauri `LocalStorageBackend`
- One store file per domain: `prompts.json`, `folders.json`, `settings.json`, `workspace.json` under the Tauri app data dir.
- Store options: `autoSave: false`, explicit `store.save()` after every write.
- **Corruption recovery** (lines 192-216): if a read throws, the file is copied to `<name>.backup.json`, then cleared and re-saved.
- **E2E isolation**: when `VITE_PROMPTDOCK_TAURI_E2E === 'true'` and `VITE_PROMPTDOCK_STORE_PREFIX` is set, store files are prefixed so Playwright/E2E runs cannot clobber a developer's real data.
- **Date serialization** — explicit `serializePrompt` / `deserializePrompt` convert `Date ↔ ISO string`.
- Default settings differ between Tauri (`defaultAction: 'paste'`) and browser (`'copy'`).

### Browser `BrowserStorageBackend`
- `localStorage` keys: `promptdock:prompts`, `promptdock:folders`, `promptdock:settings`, `promptdock:workspace`.
- Uses a generic `reviveDates(obj, dateKeys)` helper.
- Defensive try/catch around both `getItem` and `JSON.parse`; invalid JSON is logged and treated as empty (no backup attempt).
- No version field, no migration path.

### `FirestoreBackend`
- **Dynamic imports everywhere** — every method opens with `await import('firebase/firestore')` and `await import('../firebase/config')`. The Firebase SDK is never loaded at module top level.
- **Workspace-scoped and single-tenant** — constructor takes `workspaceId`; `assertPromptWorkspace` throws if a method receives a different `workspaceId`. Cross-workspace duplication instantiates a new `FirestoreBackend(target.workspaceId)`.
- **Server timestamps** — `createdAt`/`updatedAt` use `serverTimestamp()`; reads pass `serverTimestamps: 'estimate'` for optimistic UI.
- **Versions** — `increment(1)` field transform on every mutation.
- **WorkspaceId on documents** — `FirestorePromptDoc` carries a redundant `workspaceId` field; `getAll` filters on it via a `where` clause (defense-in-depth for cross-workspace queries).
- **Folder normalization in storage** — `FirestoreFolderDoc` includes a `normalizedName` field for cross-device duplicate detection; the converter strips it.
- **Atomic batch writes** — workspace bootstrap, invite acceptance, member-role updates, and workspace deletion all use `writeBatch` so multi-doc mutations cannot leave orphaned owner records.

## ANTI-PATTERNS

- **Do not call `new FirestoreBackend()` outside `SyncService`.** The construction site is the single point that owns the Firebase dependency.
- **Do not add a method to `IStorageBackend` without updating both `LocalStorageBackend` and `BrowserStorageBackend`.** The contract is symmetric.
- **Do not bypass `setFirestoreDelegate` to talk to Firestore from a repository** — that pattern is reserved for `WorkspaceRepository`'s hybrid methods. New synced repositories must use the delegate pattern.
- **Do not mutate repository cache in place.** All getters return defensive copies; mutation must go through `update()`.
- **Do not import Firebase at module level** in any repository file. Always `await import(...)` inside the method.
