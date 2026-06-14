# AGENTS.md — `src/services/`

Stateless business logic. 11 services split into **7 pure + 3 Firebase-dependent + 1 orchestrator**. All cross-service coordination is owned by `app-sync-lifecycle.ts`.

## INVENTORY

| Service | Type | Purpose | Depends on |
|---|---|---|---|
| `analytics-service.ts` | Firebase | `trackAnalyticsEvent` / `trackScreenView` / `trackPromptAction`; lazy `firebase/analytics` import; all errors swallowed | `firebase/config` |
| `auth-service.ts` | Firebase | Firebase Auth (email/password, Google); session restore; bootstraps user/workspace Firestore docs on sign-in | `firebase/config`, `firebase/env`, `utils/workspace-records` |
| `sync-service.ts` | Firebase | Firestore `onSnapshot` listeners, local→remote migration, online/offline detection, in-listener conflict detection, AppModeStore transitions | `firebase/config`, `repositories/firestore-backend`, `stores/app-mode-store`, `utils/folder-names`, `utils/prompt-variables` |
| `app-sync-lifecycle.ts` | Orchestrator | Owns `SyncService` lifecycle, wires Firestore delegates into prompt/folder repos, subscribes to `appModeStore` + `workspaceStore` | `sync-service`, `conflict-service`, `interfaces` (IAuthService), **all 5 stores**, `repositories/interfaces` |
| `conflict-service.ts` | Pure | In-memory `Map<promptId, PromptConflict>` + `Set<listener>`; `detectConflict` / `addConflict` / `processConflict` / `resolveKeepLocal` / `resolveKeepRemote` / `subscribe` / `clearAll` | `types/index` only |
| `import-export.ts` | Pure | JSON export v1.0 schema + import validation + duplicate detection (title/body/both priority) | `utils/prompt-variables`, `types/index` |
| `prompt-json.ts` | Pure | `parsePromptJson(json, {folders})` → editor draft; tag dedupe, folder resolve, variable validation. **Never creates unknown folders** | `utils/prompt-variables`, `types/index` |
| `search-engine.ts` | Pure | Case-insensitive field-priority ranking (title 4 / tags 3 / description 2 / body 1) | `types/index` only |
| `variable-parser.ts` | Pure | `{{name}}` extraction, first-appearance order, case-sensitive dedupe | `interfaces` (IVariableParser) only |
| `seed-data.ts` | Pure | Static `SEED_RECIPES` + `seedDefaultPrompts(repo)` first-launch helper | `repositories/interfaces` (IPromptRepository) only |
| `interfaces.ts` | Type-only | Defines `IVariableParser`, `ISearchEngine`, `IImportExportService`, `IAuthService` | `types/index` only |

> `prompt-renderer.ts` is referenced in the root `AGENTS.md` directory tree by mistake — it does not exist. Template rendering lives in `src/utils/prompt-template.ts` and consumes `VariableParser` from this directory.

## FIREBASE LAZY-LOADING CONTRACT

The three Firebase services use **dynamic `import()`** so the SDK never loads in local mode:

- `auth-service.ts` → `await import('firebase/auth')`, `await import('firebase/firestore')` (for workspace bootstrap)
- `sync-service.ts` → `await import('firebase/firestore')` (lazily constructs `FirestoreBackend`)
- `analytics-service.ts` → `await import('firebase/analytics')`

**Never** write `import 'firebase/...'` at module top level. Always use the cached `getFirebaseApp` / `getFirebaseAuth` / `getFirebaseFirestore` / `getFirebaseAnalytics` getters in `src/firebase/config.ts`.

## CROSS-SERVICE DEPENDENCY GRAPH

```
app-sync-lifecycle  ──▶  sync-service        (constructs SyncService)
                   ──▶  conflict-service    (type-only: ConflictService)
                   ──▶  interfaces          (IAuthService — type-only)

sync-service        ──▶  (no service deps; receives onConflictDetected as a callback)
auth-service        ──▶  (no service deps)
conflict-service    ──▶  (no service deps)
import-export       ──▶  (no service deps; uses utils/prompt-variables)
prompt-json         ──▶  (no service deps; uses utils/prompt-variables)
search-engine       ──▶  (no service deps)
variable-parser     ──▶  (no service deps; uses interfaces type-only)
seed-data           ──▶  (no service deps)
```

The only service-to-service coupling is `app-sync-lifecycle → {sync-service, conflict-service}`. `conflict-service` reaches `sync-service` only via the `onConflictDetected` callback in `SyncServiceOptions`, not an import.

## INTERFACES (`src/services/interfaces.ts`)

| Interface | Methods | Implementation |
|---|---|---|
| `IVariableParser` | `parse(template): string[]` | `VariableParser` |
| `ISearchEngine` | `search(prompts, query, options?): PromptRecipe[]` | `SearchEngine` |
| `IImportExportService` | `exportToJSON` / `importFromJSON` / `detectDuplicates` | `ImportExportService` |
| `IAuthService` | `isConfigured?` / `signUp` / `signIn` / `signInWithGoogle` / `signOut` / `restoreSession` / `sendPasswordReset` / `onAuthStateChanged` | `AuthService` |

`SyncService`, `ConflictService`, `AppSyncLifecycle`, `seed-data`, and `prompt-json` are **not** abstracted behind an interface — they're consumed as concrete classes. `ConflictService` would be a candidate if a second non-Firestore backend were added.

## AppSyncLifecycle — CALL SITES

- **Production**: `src/App.tsx` lines 19/22/35/176-199 — constructed with all 5 stores + both repos + auth + conflict + `onSyncServiceChange`; `start()` then `restoreAuthSession()`.
- **Test**: `src/services/__tests__/app-sync-lifecycle.test.ts` — single integration test that drives the auth → synced → sign-out lifecycle.

## ANTI-PATTERNS

- **No module-level Firebase import.** `await import('firebase/...')` only.
- **No persistence in `conflict-service`.** Conflicts are in-memory; cleared on reload. (See `docs/Issues.md` for the deferred follow-up.)
- **`prompt-json.ts` never creates folders.** It resolves `folder` / `folderId` against the supplied `folders` parameter; missing references are dropped silently. This rule prevents hidden or misspelled folder assignments.
- **`analytics-service.ts` swallows all errors** — tracking can never block product workflows.
- **`app-sync-lifecycle` is the only place that imports from `stores/`.** New cross-store coordination belongs there or in `src/hooks/`, not in a service file.

## PROPERTY-BASED TESTS

`src/services/__tests__/clipboard-utils.property.test.ts` is one of the 8 PBTs in the project — it verifies the clipboard fallback preserves text exactly when Tauri fails (Property 1, 100 iterations). The clipboard utilities themselves live in `src/utils/clipboard.ts`; the PBT lives here because it asserts the service-level invariant.
