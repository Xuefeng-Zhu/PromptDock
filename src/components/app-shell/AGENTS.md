# AGENTS.md — `src/components/app-shell/`

The root layout and screen router. **Highest-complexity orchestrator in `src/components/`** — composes 6 stores, gates onboarding vs. library vs. settings, and bridges to Tauri via the controller hook.

## STRUCTURE

```
src/components/app-shell/
├── AppShell.tsx               # Top-level shell — wires useAppShellController
├── AppShellView.tsx           # Pure view: sidebar + main + overlays
├── AppOverlays.tsx            # CommandPalette + VariableFillModal + Toasts
├── AppScreenRouter.tsx        # Routes between Onboarding/Library/Settings
└── (no co-located __tests__ — coverage is in src/components/__tests__/AppShell.test.tsx)
```

## HOW IT WORKS

`AppShell.tsx` calls `useAppShellController()`, which lives at `src/hooks/use-app-shell-controller.ts` and composes:

- `useAppModeActions` — auth outcome → `AppModeStore` transitions
- `useShellNavigation` — screen selection + onboarding gate + `trackScreenView`
- `usePromptCrudActions` — prompt create/update/archive/duplicate/favorite callbacks (with viewer-denial toasts)
- `usePromptLaunchFlow` — quick-launcher entry: pick → fill variables → execute copy/paste
- `useConflictController` — `useSyncExternalStore` over `ConflictService` + resolve-and-persist

The hook does **not** register the global hotkey. Hotkey registration lives in `App.tsx:158` (called once during `runAppInitialization()` after the settings store is loaded), not in the AppShell controller. The controller only reads `useSettingsStore` for the configured hotkey combo and forwards it to the launcher.

## STORES IT TOUCHES

`AppShell` reads from **all 6 stores** directly via the controller:

| Store | Purpose |
|---|---|
| `usePromptStore` | Prompt list, filter state, active workspace mirror |
| `useFolderStore` | Folder list, active workspace mirror |
| `useSettingsStore` | Theme + hotkey + default action |
| `useWorkspaceStore` | Authoritative `activeWorkspaceId`, role |
| `useAppModeStore` | AppMode (`local`/`synced`/`offline-synced`), user, sync status |
| `useToastStore` | Toast queue (rendered via `AppOverlays`) |

## ANTI-PATTERNS

- **Do not add business logic to `AppShellView.tsx`** — it is a pure view that renders what the controller hands it. Logic goes in the controller or its sub-hooks.
- **Do not import from `src/repositories/`.** The shell is downstream of the store layer.
- **Do not put per-feature concerns in `app-shell/`.** Feature composition lives in the feature subdir. The shell only routes, does not implement.
- **Do not read `__TAURI_INTERNALS__` here.** Tauri detection is centralized in `src/utils/runtime.ts`; the shell calls `useSettingsActions` / `usePromptExecution`, which do runtime gating internally.

## TESTING

- `src/components/__tests__/AppShell.test.tsx` (1.1K+ lines) — wires `initFolderStore` / `initPromptStore` / `initSettingsStore` / `initAppModeStore` / `initWorkspaceStore` and exercises the full screen flow.
- `src/components/__tests__/AppShell.conflict.integration.test.tsx` — drives the conflict-resolution end-to-end flow with mock repos + `ConflictService`.

These two tests are the integration backbone of the app. They use the **init-singleton pattern** (see `src/stores/AGENTS.md`).
