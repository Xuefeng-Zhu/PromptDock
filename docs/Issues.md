# Deferred Workspace Issues

These issues are intentionally documented but not fixed in this pass.

## Issue: Firestore Workspace Bootstrap Is Incomplete

**Severity:** Critical
**Category:** Correctness / Security
**Location:** `firestore.rules`, `src/services/auth-service.ts`

Firestore prompt reads and writes require workspace membership, but the app currently creates only a `/users/{uid}` document during signup. It does not create the user workspace or the owner membership document required by the rules.

**Impact:** Real synced-mode users can hit `permission-denied` when the app tries to read or write prompts.

**Suggested Fix:** Add an explicit workspace bootstrap flow after signup/signin and align the Firestore rules so a user can create their initial workspace and owner membership safely.

## Issue: Active Workspace Is Not a Single Source of Truth

**Severity:** High
**Category:** Correctness / Maintainability
**Location:** `src/components/AppShell.tsx`, `src/stores/prompt-store.ts`, `src/stores/settings-store.ts`

New prompts are created with `workspaceId: 'local'`, while synced mode uses a user/workspace ID for Firestore paths and queries. The prompt store keeps its own `activeWorkspaceId`, settings keep another one, and neither is updated consistently on sync transitions.

**Impact:** Synced prompts can be written to one location but filtered out or reloaded from another, causing prompts to disappear after snapshots or manual reloads.

**Suggested Fix:** Introduce one workspace state owner, update it during mode transitions, and route all create/reload/import operations through that value.

## Issue: Folder Persistence Is Not Workspace-Aware

**Severity:** Medium
**Category:** Architecture / Correctness
**Location:** `src/utils/folder-storage.ts`, `src/components/AppShell.tsx`

User-created folders are stored directly in browser `localStorage`, outside the repository/storage abstraction and outside Firestore sync.

**Impact:** Folder data can diverge between browser, Tauri local storage, and synced mode. Folders are also not scoped to a workspace.

**Suggested Fix:** Add a folder repository/store backed by `IStorageBackend`, then make folder persistence workspace-scoped before adding sync support.
