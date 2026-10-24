# AGENTS.md — `src/stores/`

Zustand state. **6 stores total** — 4 core (repository-backed, persist data) + 2 auxiliary (in-memory only). The same `factory + init + singleton` pattern is reused across 5 of 6 stores. Stores **never import from each other**; cross-store coordination lives in `services/app-sync-lifecycle.ts` and `hooks/use-app-shell-controller.ts`.

## INVENTORY

| Store | LOC | Class | Repository? |
|---|---:|---|---|
| `prompt-store.ts` | 253 | **Core** — prompt CRUD, filter/search/folder state, workspace-scoped ops, usage tracking | `IPromptRepository` |
| `folder-store.ts` | 111 | **Core** — folder CRUD, workspace-scoped | `IFolderRepository` |
| `settings-store.ts` | 97 | **Core** — user preferences (theme, hotkey, default action) | `ISettingsRepository` |
| `workspace-store.ts` | 496 | **Core + sync glue** — authoritative `activeWorkspaceId`; members, memberships, email + domain invites, role derivation, optimistic state pruning | `IWorkspaceRepository` |
| `app-mode-store.ts` | 121 | **Auxiliary** — AppMode (`local`/`synced`/`offline-synced`), user, online, sync status, syncError, lastSyncedAt | none |
| `toast-store.ts` | 51 | **Auxiliary UI** — toast queue with auto-dismiss `setTimeout` | none |

## THE FACTORY + INIT + SINGLETON PATTERN

Five stores (`prompt`, `folder`, `settings`, `workspace`, `app-mode`) follow an identical three-symbol template. Canonical example: `prompt-store.ts`.

- **Factory** — `createPromptStore(repo: IPromptRepository)` returns a fresh `create<PromptStore>(...)` Zustand store. Used in unit tests with a mock repository to get a test-scoped instance.
- **Singleton initializer** — `initPromptStore(repo)` assigns a module-level `_store: StoreApi<PromptStore> | null` and returns it. Called once in `App.tsx` inside `runAppInitialization()`. Vite HMR survival is wired here via `import.meta.hot.data` / `import.meta.hot.dispose` so in-memory state survives HMR reloads.
- **Component hook** — `usePromptStore(selector?)` throws if `_store === null`, otherwise delegates to `useStore`. Use this from React components.

`toast-store.ts` is the **only exception** — it exports `useToastStore = create(...)` directly with no factory / init / HMR block. Justifiable: transient UI state, never persisted.

`workspace-store.ts` adds one extra wrinkle: inside `useWorkspaceStore`, if `_store === null` **and** `import.meta.env.MODE === 'test'`, it auto-builds `createTestWorkspaceRepository()` so test files don't need to call `initWorkspaceStore` first.

## CROSS-STORE COORDINATION

**No store imports another store.** The only intra-folder imports are:
- `../types/index`
- `../repositories/interfaces`
- `../utils/workspace-role` (workspace-store only)

Multi-store coordination lives **outside** this folder:

- `src/services/app-sync-lifecycle.ts` — typed against all 5 main stores (`AppModeStore`, `FolderStore`, `PromptStore`, `SettingsStore`, `WorkspaceStore`); the only place that touches multiple stores together.
- `src/hooks/use-app-shell-controller.ts` — imports 5 of the 6 stores and stitches them into a controller.
- `src/contexts/AppModeProvider.tsx` — bridges `useAppModeStore` into a plain React `useAppMode()` hook for non-Zustand consumers.

**Active workspace mirroring**: `prompt-store.ts` and `folder-store.ts` expose a `setActiveWorkspaceId(workspaceId)` action (prompt line 198, folder line 68) and cache an `activeWorkspaceId` field. The `workspace-store.ts` source comment (lines 117-119) is explicit: *"This store is the authoritative active-workspace owner; prompt/folder stores mirror its id only as a repository target cache."* Mirroring is pushed by external code, not by store-to-store calls.

## BUSINESS LOGIC HOTSPOTS

### `workspace-store.ts` (heaviest, 496 LOC)
- `chooseActiveWorkspace(workspaces, preferredId, fallbackId)` — selection algorithm.
- `removeWorkspaceFromState(state, workspaceId, fallbackId)` — purges workspace, memberships, members, invites, domainInvites, and recomputes the active id.
- Race protection in `loadWorkspaceDetails`: re-reads the store at line 187 before committing, aborts if user / active workspace / role changed mid-flight.
- Role-gated actions: `inviteMember`, `createDomainInvite`, `renameWorkspace` all check `currentRole === 'owner'`.
- Owner self-protection: `updateMemberRole` and `removeMember` reject "owners cannot demote/remove themselves".
- `acceptInvite` / `acceptDomainInvite` re-run `loadForUser` to refresh the entire membership/workspace set.

### `prompt-store.ts` (second-heaviest, 253 LOC)
- `clearFolderAssignments(folderId)` — bulk update via `Promise.all` over affected prompts, then a single `set` with `Map`-based id lookup; also clears the folder filter if it pointed at the deleted folder.
- `archivePrompt` — optimistic local fallback (`fallbackArchivedPrompt`) if the post-soft-delete `repo.getById` fails, so the UI is never blocked by a read failure.
- `restorePrompt` — chooses `repo.reloadAll` vs `repo.getAll` defensively to handle repositories that haven't yet implemented the reload path.
- `duplicatePromptToWorkspace` — guarded by `if (!repo.duplicateToWorkspace) throw`; only writes the new prompt into state when the target workspace equals the active one.

## INITIALIZATION (App.tsx:138-142)

```ts
const appModeStore   = initAppModeStore();             // no args
const promptStore    = initPromptStore(promptRepo);
const folderStore    = initFolderStore(folderRepo);
const settingsStore  = initSettingsStore(settingsRepo);
const workspaceStore = initWorkspaceStore(workspaceRepo);
```

Order: app-mode first (no deps), then the four repository-backed stores. Repositories are constructed from the chosen `IStorageBackend` immediately before (App.tsx:114-135).

After stores are built (App.tsx:150-152):
```ts
promptStore.getState().loadPrompts();
folderStore.getState().loadFolders();
settingsStore.getState().loadSettings();
```

`toast-store` is never initialized — its singleton is the `create()` call at module load.

## ANTI-PATTERNS

- **Do not import another store.** Use `services/app-sync-lifecycle.ts` or `hooks/use-app-shell-controller.ts` for cross-store coordination.
- **Do not touch `localStorage` / Tauri Store / Firestore directly.** Persistence goes through the injected `I*Repository`. `app-mode-store` is the only exception (it has no repository, but it also has no persistence).
- **Do not call a store before its `init*()` is invoked.** Stores throw on use-before-init (`prompt-store.ts:241`, `folder-store.ts:99`, `settings-store.ts:64`, `workspace-store.ts:481`, `app-mode-store.ts:109`).
- **Do not skip the `error-message` toast on async errors.** All store mutators wrap their repo calls and surface failures via `useToastStore`.
- **Do not store mutable references.** The store is the observable UI state; the repository cache is durable storage. Don't conflate them (`docs/ARCHITECTURE.md:161`).
- **Personal workspace protection** — `workspace-store.ts:242` throws on personal-workspace deletion. UI never exposes the affordance; the throw is the safety net.
- **Owner self-protection** — `workspace-store.ts:369,386` throws on owner self-demote / self-remove. The hooks in `app-shell/` surface this as a toast.
- **No TODO/FIXME/HACK markers** in this directory.

## VIEWER DENIAL CATALOG (FROM `hooks/app-shell/use-prompt-crud-actions.ts`)

Synced workspaces use `owner` / `editor` / `viewer` roles. Viewers **can search/copy/paste** but cannot mutate. The denial strings (all `throw` in the store + `toast` in the hook) are:

- "Viewers cannot create folders in this workspace."
- "Viewers cannot delete folders in this workspace."
- "Viewers can copy prompts, but cannot change favorites."
- "Viewers cannot edit prompts in this workspace."
- "Viewers cannot archive prompts in this workspace."
- "Viewers cannot restore prompts in this workspace."
- "Viewers cannot delete prompts in this workspace."
- "Viewers cannot edit tags in this workspace."
- "Viewers cannot move prompts in this workspace."
- "Viewers cannot import prompts into this workspace."

(Editor + viewer also cannot list outgoing invites — `workspace-store.test.ts:193`.) Reuse the strings; don't fork them.

## HMR SURVIVAL

The 5 main stores stash `_store` in `import.meta.hot.data` and restore it on `import.meta.hot.dispose`. This means in-memory state survives HMR reloads — important for keeping prompt edits while iterating. `toast-store.ts` opts out (toasts are intentionally ephemeral).
