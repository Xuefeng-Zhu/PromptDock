# AGENTS.md — `src/components/ui/`

The design-system layer. 10 reusable primitives + a listbox hooks subfolder. **Every screen composes from this layer** — new UI primitives belong here, not in feature folders.

## PRIMITIVES

| Component | File | Purpose |
|---|---|---|
| `Button` | `Button.tsx` | Primary action button (variants) |
| `Card` | `Card.tsx` | Surface container with consistent padding/border |
| `ConfirmationDialog` | `ConfirmationDialog.tsx` | Modal confirm/cancel — used by destructive actions |
| `HotkeyRecorder` | `HotkeyRecorder.tsx` | **Tauri-aware** — captures a keyboard combo, formats it for the `register_hotkey` command via pure-JS `utils/hotkey-recorder` |
| `IconTile` | `IconTile.tsx` | Square icon surface (used in onboarding) |
| `Input` | `Input.tsx` | Text input (used everywhere) |
| `SearchableMultiSelect` | `SearchableMultiSelect.tsx` | Composable multi-select dropdown with search |
| `Select` | `Select.tsx` | Single-select dropdown |
| `TagPill` | `TagPill.tsx` | Tag chip (used in tag editors + library card) |
| `Textarea` | `Textarea.tsx` | Multi-line text input |
| `Toggle` | `Toggle.tsx` | Switch / on-off control |

## LISTBOX SUBFOLDER

`src/components/ui/listbox/` holds three behavior hooks shared by `Select` and `SearchableMultiSelect`:

- `use-anchored-dropdown-position.ts` — positions a dropdown relative to a trigger element
- `use-dismissable-popover.ts` — outside-click + Escape dismissal
- `use-listbox-navigation.ts` — keyboard navigation (Arrow keys, Home/End, type-ahead)
- `listbox-option-class.ts` — shared class string builder

`Select` and `SearchableMultiSelect` compose from these hooks. New dropdown-shaped primitives should reuse them.

## TEST CONVENTION (DIFFERENT FROM OTHER SUBDIRS)

`ui/` has its own `__tests__/` home — 7 test files. When you add a primitive, add a co-located `ComponentName.test.tsx`. This is the **only** subdir besides `prompt-inspector/` that follows the co-located pattern.

## ANTI-PATTERNS

- **Do not import `@tauri-apps/*` from any other component** beyond `HotkeyRecorder.tsx`. The funnel goes: `components/ui/HotkeyRecorder.tsx` → `utils/hotkey-recorder.ts` (pure JS) → `utils/hotkey.ts` (Tauri invoke) → `src-tauri/src/commands.rs`.
- **Do not duplicate a primitive in a feature folder.** If you need a slight variant, extend the existing primitive (add a prop) or add a new primitive here.
- **Do not bypass `field-control-class.ts`** when adding input controls — it is the single source of truth for shared input chrome.
- **Do not put domain-specific copy in a primitive.** The primitive is app-agnostic; domain labels and icons belong in the consuming feature.

## ADDING A PRIMITIVE

1. Add `MyControl.tsx` in this directory.
2. Extend `index.ts` (the barrel).
3. Add co-located `__tests__/MyControl.test.tsx` with jsdom (`// @vitest-environment jsdom`).
4. If the control is a listbox/popover pattern, prefer reusing the hooks in `listbox/`.
5. Preserve accessibility roles/labels — primitives are reused in many contexts.
