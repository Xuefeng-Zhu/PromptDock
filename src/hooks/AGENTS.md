# AGENTS.md — `src/hooks/`

React custom hooks. **20 hooks total** — 15 top-level + 5 in `app-shell/` subfolder. Most are screen-local; only 3 are true cross-screen utilities.

## TOP-LEVEL HOOKS (15)

| Hook | Purpose | Test |
|---|---|---|
| `use-app-shell-controller.ts` | Top-level orchestrator — composes the 5 app-shell sub-hooks for `<AppShell>` | ✓ |
| `use-auth-form.ts` | Email/password + Google + sign-out form state, normalizes `IAuthService` errors | ✓ |
| `use-conflicts.ts` | `useSyncExternalStore` over `ConflictService.subscribe` for unresolved conflicts | — |
| `use-highlighted-index.ts` | Keyboard highlight index with `resetKey` invalidation | ✓ |
| `use-library-data.ts` | Combines prompts + folders + filters into derived view (counts, tag options, fallback folders) | ✓ |
| `use-onboarding-flow.ts` | Coordinates first-run local-vs-signin path; marks onboarding complete + transitions `AppModeStore` | — |
| `use-prompt-editor-form.ts` | Prompt create/edit form: variables, tags, dirty state, char/word counts, save validation | ✓ |
| `use-prompt-execution.ts` | **Tauri bridge** — copy-or-paste orchestration + `trackPromptAction` analytics + usage tracking | ✓ |
| `use-prompt-filter-popover.ts` | Filter popover state: draft filters, active chips, `useDismissablePopover` integration | ✓ |
| `use-prompt-import-export.ts` | JSON import/export workflow, duplicate resolution (skip/overwrite), workspace-aware save | ✓ |
| `use-prompt-search-results.ts` | Memoized wrapper over `SearchEngine`; also exports pure `searchPromptResults` for tests | ✓ |
| `use-settings-actions.ts` | **Tauri bridge** — settings mutations wrapped in Tauri-runtime checks + user-facing errors; hides hotkey/paste in browser | ✓ |
| `use-settings-scroll-spy.ts` | IntersectionObserver-style scroll-spy for in-page settings nav; caller-owned section refs | ✓ |
| `use-variable-fill.ts` | Variable-fill modal: defaults seeding, async copy/paste with unmount guard | — |
| `use-workspace-sharing-settings.ts` | Workspace-sharing settings: create/rename/leave, invite accept, domain invite | ✓ |

## `app-shell/` SUBFOLDER (5) — PRIVATE TO `use-app-shell-controller`

```
src/hooks/app-shell/
├── use-app-mode-actions.ts        # auth outcome → AppModeStore transitions (mode/user/userId)
├── use-conflict-controller.ts     # useSyncExternalStore for unresolved conflict count + resolve-and-persist
├── use-prompt-crud-actions.ts     # prompt create/update/archive/duplicate/favorite callbacks (with viewer-denial toasts)
├── use-prompt-launch-flow.ts      # quick-launcher entry: pick prompt → fill variables → execute copy/paste
└── use-shell-navigation.ts        # screen selection, onboarding gate, analytics trackScreenView
```

These are private implementation details of `use-app-shell-controller` and may import freely from `react`, store types, the analytics service, utility helpers, and component types — the controller and its sub-hooks are the same unit. Don't reach into them from feature components; use the public controller instead.

## CROSS-SCREEN vs SCREEN-LOCAL

**True cross-screen utilities** (used by 2+ features):

- `use-highlighted-index.ts` — used by both the quick launcher and the command palette
- `use-auth-form.ts` — used by settings + onboarding + auth card
- `use-app-shell-controller.ts` — used by App + AppShell + tests

**Screen-local** — every other hook is consumed by one screen or feature.

## TAURI BRIDGING (2 HOOKS)

Only **two** hooks directly call `src/utils/` for Tauri operations:

- `use-prompt-execution.ts` → `copyToClipboard` + `pasteToActiveApp` (Tauri clipboard + `enigo` paste simulation)
- `use-settings-actions.ts` → `registerHotkey` / `unregisterHotkey` (Tauri global shortcut)

All other hooks talk to Zustand stores only. New Tauri bridging belongs in one of these two hooks (or in `src/utils/`, not in a new hook).

## ANTI-PATTERNS

- **Do not import from `src/repositories/`.** Hooks use `useXxxStore()` only; persistence is the store's job.
- **Do not call `@tauri-apps/*` directly.** Use the `src/utils/` bridge modules; the hook layer is the runtime-aware entry point.
- **Do not duplicate viewer-denial toast strings** in a new feature hook — copy from `app-shell/use-prompt-crud-actions.ts` and `use-app-shell-controller.ts` (see `src/stores/AGENTS.md` for the catalog).
- **Do not put a hook in `app-shell/`** unless it is a private piece of `use-app-shell-controller`. Public hooks belong at the top level.
- **Do not skip the test for a cross-screen hook** — `use-highlighted-index`, `use-auth-form`, and `use-app-shell-controller` have tests because they're used in 2+ places. Screen-local hooks without tests are tracked in the test backlog (see below).

## TEST BACKLOG (7 HOOKS WITHOUT TESTS)

- `use-conflicts.ts`
- `use-onboarding-flow.ts`
- `app-shell/use-prompt-crud-actions.ts`
- `app-shell/use-conflict-controller.ts`
- `app-shell/use-app-mode-actions.ts`
- `app-shell/use-shell-navigation.ts`
- `use-variable-fill.ts`

The `app-shell/` hooks are private to `use-app-shell-controller` (which has comprehensive tests), so the absence of individual test files is a coverage gap, not a behavior gap. The other four are higher priority for new tests.
