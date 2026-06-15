# AGENTS.md — `src/components/settings/`

The settings screen and its 7 cards. The **only** screen with deep Tauri-aware runtime gates (hotkey + paste).

## STRUCTURE

```
src/components/settings/
├── SettingsScreen.tsx           # Top-level screen; uses useSettingsScrollSpy
├── SettingsNav.tsx              # In-page left rail with section anchors
├── SettingsCards.tsx            # Card registry exported for nav (7 cards)
├── SettingsSkeleton.tsx         # Loading skeleton
├── settings-data.tsx            # Static copy/metadata
├── index.ts                     # Barrel
└── cards/                       # 7 cards + 11 helper/section/dialog files
    ├── AboutSettingsCard.tsx
    ├── AccountSettingsCard.tsx
    ├── AppearanceSettingsCard.tsx
    ├── DefaultBehaviorSettingsCard.tsx  # Hosts the paste-support filter (Tauri-gated)
    ├── HotkeySettingsCard.tsx           # RUNTIME-GATED: only if canUseGlobalHotkeys
    ├── ImportExportSettingsCard.tsx     # RUNTIME-GATED: viewer cannot import
    ├── WorkspaceSharingSettingsCard.tsx
    └── (helper/dialog/section files: ImportExportMessages, InviteMemberDialog,
        SettingsCardTitle, SettingsOptionLabel, WorkspaceDomainAccessSection,
        WorkspaceInvitationsSection, WorkspaceListSection, WorkspaceMembersSection,
        WorkspaceRenameSection, WorkspaceSharingRole, WorkspaceSharingSettingsSections)
```

`SettingsCards.tsx` re-exports the 7 cards listed above; the other 11 files in `cards/` are internal helpers, dialogs, and section sub-components of `WorkspaceSharingSettingsCard`.

## RUNTIME GATES

`SettingsScreen.tsx` is the only place that uses `canUseGlobalHotkeys` and `canUsePasteAction` (both derived from `isTauriRuntime()`):

- `HotkeySettingsCard` — hidden when `!canUseGlobalHotkeys` (browser runtime)
- Paste support inside `DefaultBehaviorSettingsCard` — hidden when `!canUsePasteAction` (browser cannot synthesize paste)

These two utilities also surface in `useSettingsActions` so the hotkey action button is disabled in browser mode.

## WHAT IT READS

- `useSettingsStore` — current settings (theme, hotkey, default action, active workspace id)
- `useAppModeStore` — current user / app mode
- `useWorkspaceStore` — workspace list + role (for `WorkspaceSharingSettingsCard`)
- `usePromptStore` / `useFolderStore` — for `ImportExportSettingsCard`

## ANTI-PATTERNS

- **Do not add a card that silently degrades on browser.** If the feature is Tauri-only, gate its render with `canUseX()` and hide the entire card in browser mode (don't show a disabled stub).
- **Do not duplicate theme logic.** All theme changes go through `useSettingsActions`, which writes to `SettingsStore` and applies the class via `utils/theme.ts`.
- **Do not edit `settings-data.tsx` for runtime behavior.** It's static copy/metadata only.
- **Viewer role denials** in `WorkspaceSharingSettingsCard` and `ImportExportSettingsCard` use the same toast catalog as `app-shell/` — see `src/hooks/app-shell/use-prompt-crud-actions.ts` for the strings. Reuse them; don't fork.
- **Do not invent card names.** Always cross-check the 7 cards exported by `SettingsCards.tsx` before adding or referencing a settings card.

## TESTING

- `src/components/__tests__/SettingsScreen.test.tsx` (60K+ lines, the largest test file in the project) — covers the 7 cards with test-scoped store inits.

## ADDING A NEW CARD

1. Add `MyCardSettingsCard.tsx` in `cards/`.
2. Add a re-export in `SettingsCards.tsx` (this is the canonical source of card names).
3. Add a `data-section` anchor for the `useSettingsScrollSpy` left rail.
4. Add coverage in `SettingsScreen.test.tsx` (this file is the only test home for settings).
5. If the card depends on Tauri-only behavior, gate it with `canUseX()` derived from `isTauriRuntime()`.
