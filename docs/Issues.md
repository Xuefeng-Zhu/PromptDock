# Deferred Workspace Issues

These remaining issues are intentionally documented for future work.

## Issue: Workspace State Still Has Multiple Owners

**Severity:** High
**Category:** Correctness / Maintainability
**Location:** `src/components/AppShell.tsx`, `src/stores/prompt-store.ts`, `src/stores/settings-store.ts`

The sign-in path now sets the active workspace to the Firebase user ID and routes new/imported prompts through that workspace. The prompt store and settings store still keep separate copies of the active workspace, though, so future multi-workspace work should introduce one authoritative workspace state owner.

**Impact:** Future workspace switching could drift if a caller updates only one store.

**Suggested Fix:** Introduce one workspace state owner and route all create/reload/import operations through that value.

## Issue: Folder Persistence Is Not Workspace-Aware

**Severity:** Medium
**Category:** Architecture / Correctness
**Location:** `src/utils/folder-storage.ts`, `src/components/AppShell.tsx`

User-created folders are stored directly in browser `localStorage`, outside the repository/storage abstraction and outside Firestore sync.

**Impact:** Folder data can diverge between browser, Tauri local storage, and synced mode. Folders are also not scoped to a workspace.

**Suggested Fix:** Add a folder repository/store backed by `IStorageBackend`, then make folder persistence workspace-scoped before adding sync support.
