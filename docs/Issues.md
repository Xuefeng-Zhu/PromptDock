# Deferred Workspace Follow-Ups

These remaining workspace-related gaps are intentionally documented for future work.

## Issue: Workspace Sharing Needs Emulator E2E Coverage

**Severity:** Medium
**Category:** Test Coverage
**Location:** `src/stores/workspace-store.ts`, `src/repositories/workspace-repository.ts`, `e2e/`

`WorkspaceStore` is now the authoritative active-workspace owner. Prompt and folder stores mirror its ID only as repository targets, and `SettingsStore` persists the active workspace for session restore. The remaining gap is automated coverage for multi-user synced workspace flows.

The current Playwright suite exercises the browser/localStorage runtime. It does not sign into Firebase emulators, create multiple test users, accept email/domain invites, or assert owner/editor/viewer Firestore rule behavior from the app UI.

**Impact:** Workspace sharing regressions may rely on unit tests and manual emulator checks instead of end-to-end coverage.

**Suggested Fix:** Add Firebase emulator E2E coverage for workspace creation, workspace switching, email invite acceptance, domain invite acceptance, viewer read-only behavior, and member role changes.
