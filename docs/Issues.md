# Deferred Workspace Issues

These remaining issues are intentionally documented for future work.

## Issue: Workspace State Still Has Multiple Owners

**Severity:** High
**Category:** Correctness / Maintainability
**Location:** `src/components/AppShell.tsx`, `src/stores/prompt-store.ts`, `src/stores/settings-store.ts`

The sign-in path now sets the active workspace to the Firebase user ID and routes new/imported prompts through that workspace. The prompt store and settings store still keep separate copies of the active workspace, though, so future multi-workspace work should introduce one authoritative workspace state owner.

**Impact:** Future workspace switching could drift if a caller updates only one store.

**Suggested Fix:** Introduce one workspace state owner and route all create/reload/import operations through that value.
