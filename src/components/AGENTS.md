# AGENTS.md — `src/components/`

React UI layer. 25 subdirectories organized by **feature domain** (not by component type), plus 3 dedicated test homes. AGENTS.md files exist for the high-complexity subdirs; this file is the index.

## STRUCTURE

```
src/components/
├── __tests__/                 # 22 test files — most component tests live here
├── app-shell/                 # Highest-complexity orchestrator + screen routing
├── library/                   # LibraryScreen + grid + filters + sort
├── prompt-editor/             # Create/edit form pieces (12 sub-components)
├── prompt-card/               # Card visual + text/category-icons data
├── prompt-tags/               # TagAutocompleteInput (single-file subdir)
├── prompt-variables/          # PromptVariableValueControl (single-file subdir)
├── prompt-actions/            # Per-prompt action menu + duplicate dialog
├── prompt-filters/            # Library filter popover (10 sub-components)
├── prompt-inspector/          # Right-pane detail view + co-located __tests__/
├── prompt-search/             # ⌘K CommandPalette + SearchBar
├── variable-fill/             # {{var}} fill modal (5 sub-components)
├── sidebar/                   # Nav sidebar (folders/tags/filter chips)
├── top-bar/                   # App header + account menu
├── workspaces/                # Workspace switcher (7 store reads)
├── settings/                  # Settings screen + 17 cards
├── onboarding/                # First-run wizard
├── account/                   # Auth forms (email + Google)
├── sync/                      # Sync status surfaces
├── conflicts/                 # Conflict badge + list (UI only)
├── feedback/                  # ToastContainer (reads useToastStore)
├── shared/                    # ErrorBoundary + EmptyState
├── ui/                        # Reusable primitives (10 + listbox/ subfolder)
└── sync/                      # SyncStatusBadge + SyncStatusBar
```

## TEST LOCATION (NON-OBVIOUS)

There is **no "one test per subdir"** convention. Tests live in **three** places, and most components rely on the top-level one:

| Test home | Files | Convention |
|---|---:|---|
| `src/components/__tests__/` | 22 | Default for everything except `ui/` and `prompt-inspector/` |
| `src/components/ui/__tests__/` | 7 | Only `ui/` primitives (Button, Card, ConfirmationDialog, Input, Textarea, Toggle, listbox-option-class) |
| `src/components/prompt-inspector/__tests__/` | 1 | Only `PromptInspectorHeader` |

A subdir with no test file in itself (e.g., `workspaces/`, `account/`, `prompt-filters/`) usually still has coverage via the top-level `__tests__/` home. Coverage gaps should be flagged against the component, not the directory layout.

## WHERE TO LOOK

| Task | Location |
|---|---|
| Add a feature screen | New `src/components/<feature>/` subdir; tests in `src/components/__tests__/ScreenName.test.tsx` |
| Add a reusable primitive | `src/components/ui/` + co-located `__tests__/UiName.test.tsx` |
| Add a settings card | `src/components/settings/cards/` (existing cards there); the 17 cards are the single largest subdir |
| Wire a screen to stores | Use the matching hook from `src/hooks/` (e.g. `use-app-shell-controller`, `use-workspace-sharing-settings`) — never reach into repositories |
| Render the Tauri hotkey recorder | `src/components/ui/HotkeyRecorder.tsx` — the only direct Tauri bridge in `components/` |

## ANTI-PATTERNS

- **Do not import from `src/repositories/`.** Components use `useXxxStore()` hooks only. (`docs/ARCHITECTURE.md:264`.)
- **Do not import from `@tauri-apps/*` directly.** Funnel via `src/utils/` (clipboard, hotkey, window, file-dialog) or `src/hooks/` (use-prompt-execution, use-settings-actions). The single exception is `ui/HotkeyRecorder.tsx` (which uses the pure-JS `utils/hotkey-recorder.ts`).
- **Do not duplicate design-system primitives.** If you need a button/input/select/toggle, import from `src/components/ui/`. New primitives belong in `ui/` with co-located tests.
- **Do not put full-page screens in `src/screens/`.** Three "screens" actually live in feature subdirs: `LibraryScreen.tsx` (library/), `OnboardingScreen.tsx` (onboarding/), `SettingsScreen.tsx` (settings/). `src/screens/` is reserved for the separate Tauri quick-launcher windows and the conflict center.
- **Hooks leaking into feature folders**: `prompt-search/useSearchOverlayFocus.ts` and `sidebar/use-inline-folder-create.ts` are hooks co-located in feature folders. Match the existing pattern only if the hook is private to that feature; otherwise put it in `src/hooks/`.
- **Static data in feature folders**: `prompt-card/text.ts`, `prompt-card/category-icons.tsx`, `account/account-display.ts`, `onboarding/onboarding-data.tsx` are data modules co-located with their consumers. Acceptable, but consider `src/data/` or the feature's `index.ts` for new data.

## SUB-AGENTS.MD

| Path | Why it has its own doc |
|---|---|
| `src/components/ui/AGENTS.md` | Design-system primitives (10 components + listbox/) — affects every screen |
| `src/components/app-shell/AGENTS.md` | Top-level orchestrator — coordinates 6 stores, defines screen routing |
| `src/components/settings/AGENTS.md` | 17 cards, runtime-gated hotkey/paste sections |
