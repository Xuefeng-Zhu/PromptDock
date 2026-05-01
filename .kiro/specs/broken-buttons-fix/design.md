# Broken Buttons Fix — Bugfix Design

## Overview

Multiple interactive buttons across PromptDock render visually but lack `onClick` handlers or only close a dropdown without performing their labeled action. The root cause is a wiring gap: AppShell defines callback functions (e.g., `handleArchivePrompt`, `handleDuplicatePrompt`) and reads store actions (`archivePrompt`, `duplicatePrompt`, `toggleFavorite`, `deletePrompt`, `copyToClipboard`) but never passes them as props to child components (`PromptInspector`, `PromptEditor`, `LibraryScreen`, `TopBar`). The fix involves adding callback props to affected components and threading the existing AppShell handlers down through the component tree.

## Glossary

- **Bug_Condition (C)**: A user clicks a button that has a visible label implying an action (Duplicate, Archive, Copy, Delete, Favorite star, Edit prompt, Sync, etc.) but the button has no `onClick` handler or only closes a menu without performing the action.
- **Property (P)**: Every labeled action button SHALL invoke the corresponding store action or utility function when clicked, producing the expected side effect (state change, clipboard write, navigation, toast notification).
- **Preservation**: All existing working behaviors — Save, Cancel, New Prompt, filter chips, prompt card selection, sidebar navigation, settings, search, dropdown toggle, grid/list toggle — must remain unchanged.
- **AppShell**: The root layout orchestrator in `src/components/AppShell.tsx` that manages navigation state and wires store actions to callbacks.
- **PromptInspector**: The detail panel in `src/components/PromptInspector.tsx` that shows prompt metadata, body, and action buttons.
- **PromptEditor**: The create/edit form in `src/components/PromptEditor.tsx` with header action buttons (Duplicate, Archive, Copy) in edit mode.
- **PromptStore**: Zustand store in `src/stores/prompt-store.ts` exposing `duplicatePrompt`, `archivePrompt`, `deletePrompt`, `toggleFavorite`, `updatePrompt`, `loadPrompts`.
- **copyToClipboard**: Utility in `src/utils/clipboard.ts` that copies text via Tauri with browser fallback.
- **ToastStore**: Zustand store in `src/stores/toast-store.ts` for showing success/error notifications.

## Bug Details

### Bug Condition

The bug manifests when a user clicks any action button that is rendered with a label and icon but has no `onClick` handler wired to a store action or utility function. The buttons exist in PromptInspector (favorite star, copy body, dropdown menu items), PromptEditor (Duplicate, Archive, Copy in edit mode, Save options ChevronDown), TopBar (Sync/Refresh), LibraryScreen (Filters, New Prompt ChevronDown), and Sidebar (More… buttons).

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: string, buttonLabel: string, clickEvent: MouseEvent }
  OUTPUT: boolean

  DEFINE brokenButtons = [
    { component: "PromptEditor", labels: ["Duplicate", "Archive", "Copy", "Save options"] },
    { component: "PromptInspector", labels: ["Edit prompt", "Duplicate", "Archive", "Delete", "Favorite star", "Copy prompt body", "Add tag"] },
    { component: "TopBar", labels: ["Sync"] },
    { component: "LibraryScreen", labels: ["Filters", "New prompt options"] },
    { component: "Sidebar", labels: ["More… (Folders)", "More… (Tags)"] }
  ]

  RETURN EXISTS entry IN brokenButtons WHERE
    entry.component == input.component
    AND input.buttonLabel IN entry.labels
    AND buttonHasNoEffectiveHandler(input.component, input.buttonLabel)
END FUNCTION
```

### Examples

- **PromptInspector "Duplicate"**: User clicks "Duplicate" in the three-dot dropdown → menu closes → nothing happens. Expected: `duplicatePrompt(promptId)` is called, a copy appears in the library.
- **PromptInspector favorite star**: User clicks the star icon → nothing happens. Expected: `toggleFavorite(promptId)` is called, star fills/unfills.
- **PromptEditor "Copy" button**: User clicks "Copy" in edit mode header → nothing happens. Expected: prompt body is copied to clipboard, success toast appears.
- **TopBar "Sync" button**: User clicks the refresh icon → nothing happens. Expected: `loadPrompts()` is called to refresh the prompt list.
- **PromptInspector "Delete"**: User clicks "Delete" in dropdown → menu closes → nothing happens. Expected: `deletePrompt(promptId)` is called, prompt is removed, inspector deselects.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The main "Save" button in PromptEditor must continue to call `onSave` with form data
- The "Cancel" breadcrumb link in PromptEditor must continue to call `onCancel`
- The main "New Prompt" button in LibraryScreen must continue to call `onNewPrompt`
- Filter chips (All, Favorites, Recent) must continue to call `onFilterChange`
- Clicking a prompt card must continue to select it and show it in the inspector
- Sidebar navigation items must continue to filter the library view
- Settings buttons must continue to navigate to the settings screen
- The search bar must continue to filter prompts by query
- The "More options" three-dot button in PromptInspector must continue to toggle the dropdown
- Grid/list view toggle buttons must continue to switch view modes

**Scope:**
All inputs that do NOT involve the broken buttons listed in the bug condition should be completely unaffected by this fix. This includes:
- All existing `onClick` handlers that already work
- Keyboard shortcuts (⌘K for command palette)
- Form input interactions (typing in fields, selecting folders, toggling favorite toggle)
- Drag and drop (if any)

## Hypothesized Root Cause

Based on the code analysis, the root causes are:

1. **Missing prop threading from AppShell to PromptInspector**: AppShell defines `handleArchivePrompt`, `handleDuplicatePrompt`, `handleToggleFavorite` callbacks but the `<PromptInspector>` render only passes `prompt`, `folder`, and `variables` props. The `PromptInspectorProps` interface lacks callback props entirely.

2. **Missing prop threading from AppShell to PromptEditor**: AppShell passes `onSave` and `onCancel` to PromptEditor but not `onDuplicate`, `onArchive`, or `onCopy`. The PromptEditor header buttons (Duplicate, Archive, Copy) have no `onClick` handlers.

3. **Missing prop threading from AppShell to TopBar**: TopBar accepts `onSearchChange`, `onCommandPaletteOpen`, and `onSettingsOpen` but has no `onSync` or `onRefresh` prop. The Sync/Refresh button has no `onClick`.

4. **PromptInspector dropdown items only close menu**: Each `DropdownItem` in PromptInspector receives `onClick={() => setMenuOpen(false)}` which only closes the menu without performing the labeled action.

5. **Stub buttons with no handlers**: The "Filters" button in LibraryScreen, "New Prompt" ChevronDown, Sidebar "More…" buttons, and PromptEditor "Save options" ChevronDown are UI stubs with no `onClick` handlers at all.

## Correctness Properties

Property 1: Bug Condition - Action Buttons Invoke Store Actions

_For any_ click on a broken action button (one identified by `isBugCondition`), the fixed component SHALL invoke the corresponding store action or utility function with the correct arguments (prompt ID for CRUD actions, prompt body for copy), producing the expected side effect (state mutation, clipboard write, navigation, or toast notification).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

Property 2: Preservation - Existing Working Buttons Unchanged

_For any_ click on a button that already works correctly (Save, Cancel, New Prompt, filter chips, prompt card selection, sidebar items, settings, search, dropdown toggle, grid/list toggle), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing callback invocations and state transitions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/PromptInspector.tsx`

**Changes**:
1. **Extend `PromptInspectorProps`**: Add callback props: `onToggleFavorite`, `onEdit`, `onDuplicate`, `onArchive`, `onDelete`, `onCopyBody`.
2. **Wire favorite star button**: Add `onClick={() => onToggleFavorite?.(prompt.id)}` to the star button.
3. **Wire "Copy prompt body" button**: Add `onClick` that calls `onCopyBody?.(prompt.body)`.
4. **Wire dropdown menu items**: Replace `onClick={() => setMenuOpen(false)}` with handlers that call the appropriate callback AND close the menu:
   - "Edit prompt" → `onEdit?.(prompt.id); setMenuOpen(false)`
   - "Duplicate" → `onDuplicate?.(prompt.id); setMenuOpen(false)`
   - "Archive" → `onArchive?.(prompt.id); setMenuOpen(false)`
   - "Delete" → `onDelete?.(prompt.id); setMenuOpen(false)`

**File**: `src/components/AppShell.tsx`

**Changes**:
1. **Pass callbacks to PromptInspector**: Add `onToggleFavorite`, `onEdit`, `onDuplicate`, `onArchive`, `onDelete`, `onCopyBody` props to the `<PromptInspector>` render.
2. **Create `handleDeletePrompt` callback**: Add a new callback using `deletePrompt` from the store with error toast handling.
3. **Create `handleEditPrompt` callback**: Navigate to editor screen with the prompt ID.
4. **Create `handleCopyPromptBody` callback**: Call `copyToClipboard` and show a success toast.
5. **Pass callbacks to PromptEditor**: Add `onDuplicate`, `onArchive`, `onCopy` props.
6. **Pass `onSync` to TopBar**: Add a callback that calls `loadPrompts`.

**File**: `src/components/PromptEditor.tsx`

**Changes**:
1. **Extend `PromptEditorProps`**: Add optional callback props: `onDuplicate`, `onArchive`, `onCopy`.
2. **Wire Duplicate button**: Add `onClick={() => onDuplicate?.()}`.
3. **Wire Archive button**: Add `onClick={() => onArchive?.()}`.
4. **Wire Copy button**: Add `onClick={() => onCopy?.()}`.
5. **Wire Save options ChevronDown**: Add state and handler for a save options dropdown.

**File**: `src/components/TopBar.tsx`

**Changes**:
1. **Extend `TopBarProps`**: Add optional `onSync` callback prop.
2. **Wire Sync/Refresh button**: Add `onClick={() => onSync?.()}`.

**File**: `src/components/LibraryScreen.tsx`

**Changes**:
1. **Wire "Filters" button**: Add a basic `onClick` handler (toggle a filters panel or show a toast placeholder).
2. **Wire "New Prompt" ChevronDown**: Add state and handler for a new prompt options dropdown.

**File**: `src/components/Sidebar.tsx`

**Changes**:
1. **Wire "More…" buttons**: Add `onClick` handlers (these are lower-priority stubs — can show a toast or expand the section).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component tests that render the affected components, simulate clicks on the broken buttons, and assert that the expected callbacks are invoked. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **PromptInspector Dropdown Actions**: Render PromptInspector with callback props, click each dropdown item, assert callbacks are called (will fail on unfixed code because props don't exist yet)
2. **PromptInspector Favorite Star**: Render PromptInspector, click star, assert `onToggleFavorite` is called (will fail on unfixed code)
3. **PromptEditor Edit-Mode Actions**: Render PromptEditor in edit mode, click Duplicate/Archive/Copy, assert callbacks are called (will fail on unfixed code)
4. **TopBar Sync Button**: Render TopBar, click Sync button, assert `onSync` is called (will fail on unfixed code)

**Expected Counterexamples**:
- Callback props are not accepted by components, so they cannot be invoked
- Buttons have no `onClick` handlers, so click events produce no side effects

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderComponent_fixed(input.component)
  simulateClick(input.buttonLabel)
  ASSERT expectedCallback WAS CALLED WITH correctArguments
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderComponent_original(input) = renderComponent_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing working buttons (Save, Cancel, filter chips, etc.), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Save Button Preservation**: Verify that the Save button in PromptEditor continues to call `onSave` with correct form data for any valid prompt input
2. **Filter Chip Preservation**: Verify that filter chips continue to call `onFilterChange` with the correct filter type for any filter selection
3. **Prompt Selection Preservation**: Verify that clicking prompt cards continues to call `onSelectPrompt` with the correct ID
4. **Search Preservation**: Verify that typing in the search bar continues to call `onSearchChange` with the typed query

### Unit Tests

- Test each PromptInspector dropdown item calls the correct callback with the prompt ID
- Test PromptInspector favorite star calls `onToggleFavorite` with prompt ID
- Test PromptInspector "Copy prompt body" calls `onCopyBody` with prompt body text
- Test PromptEditor Duplicate/Archive/Copy buttons call their respective callbacks
- Test TopBar Sync button calls `onSync`
- Test that dropdown menu closes after each action

### Property-Based Tests

- Generate random PromptRecipe objects and verify that for any prompt, clicking the favorite star in PromptInspector invokes `onToggleFavorite` with the correct prompt ID
- Generate random prompt body strings and verify that clicking "Copy prompt body" passes the exact body text to the copy callback
- Generate random valid form states and verify that the Save button continues to produce correct `onSave` payloads (preservation)

### Integration Tests

- Test full AppShell flow: select a prompt → click Duplicate in inspector → verify new prompt appears in the list
- Test full AppShell flow: select a prompt → click Archive in inspector → verify prompt is removed and inspector deselects
- Test full AppShell flow: click Sync in TopBar → verify `loadPrompts` is called on the store
- Test PromptEditor edit mode: open editor with existing prompt → click Copy → verify clipboard and toast
