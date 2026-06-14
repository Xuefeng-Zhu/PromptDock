# AGENTS.md — `src/utils/`

Pure helpers. **28 files** grouped into 6 buckets. The platform-boundary bucket is the only one with Tauri awareness; everything else is pure JS/TS.

## BUCKET 1 — PLATFORM BOUNDARY (6 files, Tauri-aware)

| File | Concern | Tested |
|---|---|---|
| `runtime.ts` | `isTauriRuntime()` — detects `__TAURI_INTERNALS__` in window (9 consumers) | ✓ |
| `clipboard.ts` | `copyToClipboard` / `pasteToActiveApp` via Tauri `invoke` with `navigator.clipboard` fallback | — |
| `hotkey.ts` | Normalizes combo string then `register_hotkey` / `unregister_hotkey` via Tauri invoke | ✓ |
| `hotkey-recorder.ts` | Pure-JS `KeyboardEvent` → combo string for the hotkey recorder UI (no Tauri invoke) | — |
| `window.ts` | Swallows `hide_main_window` Tauri invoke (no-op in browser) | — |
| `file-dialog.ts` | `saveFile` / `openFile` for JSON; Tauri dialogs when available, browser `showSaveFilePicker` fallback | — |
| `theme.ts` | Toggles `light` / `dark` classes on `<html>` (system mode reads `prefers-color-scheme`) | ✓ |

**Rule**: every Tauri `invoke()` is wrapped in `try { invoke(...) } catch { /* browser fallback */ }`. Browser-mode fallbacks are `navigator.clipboard.writeText` for clipboard and `showSaveFilePicker` for file dialogs. The contract is enforced in code review; there are no ESLint rules to catch a missing fallback.

## BUCKET 2 — GENERIC PRIMITIVES (5 files, no domain coupling)

| File | Concern | Importers | Tested |
|---|---|---:|---|
| `error-message.ts` | `formatErrorMessage` / `formatPrefixedErrorMessage` (Error / unknown → string) | 16 | ✓ |
| `text-counts.ts` | `countWords` / `countChars` over arbitrary text (PBT-verified) | 3 | ✓ |
| `date-format.ts` | `formatDate`, `formatRelativeShort`, `formatRelativeTime` for null-safe timestamps | 4 | ✓ |
| `list-navigation.ts` | `clampIndex(current, delta, length)` keyboard highlight helper (PBT-verified) | 2 | ✓ |
| `onboarding.ts` | `isOnboardingComplete` / `markOnboardingComplete` via `localStorage` flag | 3 | — |

`error-message.ts` is the most-imported utility in the project (16 consumers). Bugs here ripple everywhere.

## BUCKET 3 — DOMAIN: PROMPT LIBRARY (7 files)

| File | Concern | Importers | Tested |
|---|---|---:|---|
| `prompt-filters.ts` | `PromptFilters` types + `createDefaultPromptFilters`, `applyPromptFilters`, `normalizePromptFilters`, `hasArchivedPromptFilter`, `isRecentPrompt` | 13 | — |
| `prompt-variables.ts` | Variable metadata helpers (`createDefaultPromptVariable`, `resolvePromptVariables`, `areAllPromptVariablesFilled`, `isPromptVariableInputType`) | 11 | ✓ |
| `prompt-template.ts` | `extractVariables`, `splitPromptTemplateParts`, `renderPromptTemplate` (thin wrapper over `VariableParser` service) | 9 | ✓ |
| `prompt-filter-chips.ts` | `getActiveFilterChips`, `removeFilterChipFromFilters` for the chip UI; `STATUS_OPTIONS` / `LAST_USED_OPTIONS` | 5 | ✓ |
| `library-filtering.ts` | `filterPrompts` pipeline (sidebar filter → archive exclusion → search → attribute filters) | 2 | ✓ |
| `library-filter-options.ts` | `deriveTagFilterOptions`, folder/option builders with locale sort + fallback labels | 2 | — |
| `sidebar-counts.ts` | `computeFilterCounts`, `computeTagCounts` for sidebar badges (7-day recent window) | 2 | — |

> **Coverage gap (high priority)**: `prompt-filters.ts` is the central filter logic with 13 consumers and **no dedicated test**. Fix this before adding new filter behaviors.

## BUCKET 4 — DOMAIN: FOLDERS (4 files)

| File | Concern | Tested |
|---|---|---|
| `folder-label.ts` | `formatFolderLabel` strips `folder-` prefix, slug suffixes, title-cases | ✓ |
| `folder-names.ts` | `cleanFolderName`, `normalizeFolderName`, `createFolderId` slug | — |
| `folder-options.ts` | `getQuickFolderOptions` (none/folder/create quick-pick rows for combobox) | ✓ |
| `tag-options.ts` | `normalizeTag`, `resolveExistingTagName`, `getQuickTagOptions` | ✓ |

## BUCKET 5 — DOMAIN: WORKSPACES (6 files)

| File | Concern | Tested |
|---|---|---|
| `workspace-role.ts` | `formatWorkspaceRole`, `getWorkspaceRole`, `workspaceRoleBadgeClass` (Tailwind class picker) | ✓ |
| `workspace-records.ts` | `createPersonalWorkspaceRecord`, `workspaceMembershipId`, `normalizeWorkspaceEmail`, `PERSONAL_WORKSPACE_NAME` | ✓ |
| `workspace-domain.ts` | `normalizeWorkspaceDomain`, `getWorkspaceDomainFromEmail`, `assertValidWorkspaceDomain`, `workspaceDomainInviteId` | ✓ |
| `auth-error-message.ts` | `authErrorMessage(AuthError)` switch for user-facing auth copy (Firebase errors only in strings, not coupled) | — |
| `auth-service-availability.ts` | `isAuthServiceAvailable(IAuthService?)` runtime check + `AUTH_UNCONFIGURED_MESSAGE` constant | — |

## BUCKET 6 — VISUAL + FORM (1 file, mostly inside `ui/`)

`field-control-class.ts` lives in `src/components/ui/` (not here) — see `src/components/ui/AGENTS.md`.

## ADDING A NEW UTILITY

1. **Pick the right bucket.** Don't put domain logic in bucket 2; don't put Tauri calls in buckets 2-6.
2. **If Tauri-aware**, add a `try { invoke(...) } catch { /* browser fallback */ }` wrapper. Use `isTauriRuntime()` to choose the right path when behavior differs.
3. **Add a co-located test** in `src/utils/__tests__/<name>.test.ts` (or `.tsx` if you must). Use `// @vitest-environment jsdom` when the utility touches DOM (e.g., `theme.ts`, `hotkey.test.ts`).
4. **For PBT-eligible invariants** (clipboard fallback, variable extraction, count helpers, list bounds), use `fast-check` with `{ numRuns: 100 }` and append `.property.test.ts`. Document the property in the JSDoc header (`**Property N:** ... / **Validates: Requirements X.Y**`).

## ANTI-PATTERNS

- **Do not import `@tauri-apps/*` outside the platform-boundary bucket.** Components and other utils call `clipboard.ts` / `hotkey.ts` / `window.ts` / `file-dialog.ts`; they never `import { invoke } from '@tauri-apps/api/core'` themselves.
- **Do not put business logic in `error-message.ts`.** It is a pure stringifier.
- **Do not bypass `isTauriRuntime()` for new platform checks.** Runtime detection is centralized.
- **Do not skip the browser fallback.** The Tauri command may throw; the component must not crash.
- **Do not import `auth-error-message.ts` for non-`IAuthService` errors.** It is typed against the `AuthError` string union.
- **No `@deprecated` markers** in this directory.

## TEST BACKLOG (11 UNTESTED UTILS)

Bucket 1 (Tauri): `clipboard.ts`, `file-dialog.ts`, `window.ts`, `hotkey-recorder.ts` — risk: Tauri/browser branches diverging silently. Highest priority.
Bucket 2: `onboarding.ts` — risk: `localStorage` flag corruption.
Bucket 3: `prompt-filters.ts` (13 consumers!), `library-filter-options.ts`, `sidebar-counts.ts`.
Bucket 4: `folder-names.ts`.
Bucket 5: `auth-error-message.ts`, `auth-service-availability.ts`.
