# Implementation Plan: PromptDock UI Redesign

## Overview

This plan implements a complete high-fidelity desktop UI redesign for PromptDock, replacing the existing basic frontend with a polished, macOS-style productivity interface. The implementation progresses incrementally: dependencies → design tokens → base UI primitives → mock data → layout components → screen components → modal overlays → integration wiring → property-based tests → unit tests → final polish. Each step builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Install dependencies and set up design token foundation
  - [x] 1.1 Install lucide-react dependency
    - Run `npm install lucide-react@0.468.0` to add the icon library
    - Verify it appears in `package.json` dependencies
    - _Requirements: 1.6_

  - [x] 1.2 Define CSS custom properties in `src/styles.css`
    - Replace the current `src/styles.css` content with the full design token system
    - Add `:root` block with all CSS custom properties: `--color-primary` (#2563EB), `--color-primary-hover` (#1D4ED8), `--color-primary-light` (#EFF6FF), `--color-background` (#F8FAFC), `--color-panel` (#FFFFFF), `--color-border` (#E5E7EB), `--color-text-main` (#0F172A), `--color-text-muted` (#64748B), `--color-text-placeholder` (#94A3B8)
    - Add category color tokens: `--color-cat-purple` (#F3E8FF), `--color-cat-green` (#DCFCE7), `--color-cat-amber` (#FEF3C7), `--color-cat-blue` (#DBEAFE), `--color-cat-rose` (#FFE4E6), `--color-cat-teal` (#CCFBF1)
    - Add spacing tokens (`--space-xs` through `--space-xl`), typography tokens (`--font-sans`, `--font-mono`), and radius tokens (`--radius-sm` through `--radius-xl`)
    - Add a commented-out `.dark` class placeholder for future dark theme support
    - Add global focus ring styles for keyboard navigation (`:focus-visible` outline using `--color-primary`)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Create base UI primitive components
  - [x] 2.1 Create `src/components/ui/Button.tsx`
    - Implement `ButtonProps` interface extending `React.ButtonHTMLAttributes<HTMLButtonElement>` with `variant` ('primary' | 'secondary' | 'ghost' | 'danger') and `size` ('sm' | 'md' | 'lg')
    - Style with `rounded-lg`, focus ring, and variant-specific colors using CSS custom properties
    - Primary variant uses `bg-[var(--color-primary)]`, secondary uses bordered style, ghost is transparent with hover background, danger uses red tones
    - Use semantic `<button>` element
    - _Requirements: 1.4, 9.2, 9.3_

  - [x] 2.2 Create `src/components/ui/Input.tsx`
    - Implement `InputProps` interface extending `React.InputHTMLAttributes<HTMLInputElement>` with optional `label`, `error`, and `hint` props
    - Render `<label>` + `<input>` pair with consistent border, focus ring, and optional error/hint text
    - Ensure label is associated with input via `htmlFor`/`id` or wrap pattern
    - _Requirements: 1.4, 9.2, 9.3, 9.5_

  - [x] 2.3 Create `src/components/ui/Textarea.tsx`
    - Implement `TextareaProps` interface extending `React.TextareaHTMLAttributes<HTMLTextAreaElement>` with optional `label` and `error` props
    - Same styling pattern as Input but for `<textarea>` elements
    - _Requirements: 1.4, 9.2, 9.3, 9.5_

  - [x] 2.4 Create `src/components/ui/Select.tsx`
    - Implement `SelectProps` interface extending `React.SelectHTMLAttributes<HTMLSelectElement>` with `label`, `options` array (`{ value: string; label: string }[]`), and `placeholder`
    - Render `<label>` + `<select>` with consistent styling
    - _Requirements: 1.4, 9.2, 9.3, 9.5_

  - [x] 2.5 Create `src/components/ui/Toggle.tsx`
    - Implement `ToggleProps` interface with `checked`, `onChange`, `label`, and `disabled` props
    - Render a switch-style toggle using `<button>` with `role="switch"` and `aria-checked`
    - Animate the toggle knob position based on checked state
    - _Requirements: 1.4, 9.2, 9.3, 9.4_

  - [x] 2.6 Create `src/components/ui/Card.tsx`
    - Implement `CardProps` interface with `children`, `className`, and `padding` ('sm' | 'md' | 'lg')
    - Render a `<div>` with white background (`var(--color-panel)`), soft border, `rounded-xl`, and `shadow-sm`
    - _Requirements: 1.4, 9.2, 11.5_

- [x] 3. Create mock data layer
  - [x] 3.1 Create `src/data/mock-data.ts`
    - Import `PromptRecipe` and `Folder` types from `src/types/index.ts`
    - Export `CATEGORY_COLORS` record mapping category keys to `{ bg, text, icon }` objects for all 6 categories: summarize-text (Purple), rewrite (Green), ideas (Yellow/Orange), code-review (Blue), email-draft (Red/Orange), meeting-notes (Teal)
    - Export `MOCK_FOLDERS` array with 4 Folder objects: Writing, Product, Engineering, Work
    - Export `MOCK_PROMPTS` array with 6 complete PromptRecipe objects, each with realistic body templates containing `{{variable_name}}` placeholders, correct tags, folder assignments, and dates
    - Export `PROMPT_CATEGORY_MAP` record mapping prompt IDs to category keys
    - Ensure the module has no external dependencies beyond `src/types/index.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint — Verify foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create utility components
  - [x] 5.1 Create `src/components/TagPill.tsx`
    - Implement `TagPillProps` with `tag` string and optional `onRemove` callback
    - Render a small `rounded-full` badge with tag name and optional remove (×) button
    - Use muted background and text colors from design tokens
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.2 Create `src/components/IconTile.tsx`
    - Implement `IconTileProps` with `icon` (React.ReactNode) and `color` (string for CSS class or custom property)
    - Render a small colored square with pastel background and centered lucide-react icon
    - _Requirements: 9.1, 9.2, 1.6_

  - [x] 5.3 Create `src/components/SyncStatusBadge.tsx`
    - Implement `SyncStatusBadgeProps` with `status` ('local' | 'synced' | 'offline')
    - Show appropriate lucide-react icon (`HardDrive`, `Cloud`, `WifiOff`) with text label
    - Ensure status is conveyed by both icon and text (not color alone)
    - _Requirements: 9.1, 9.2, 9.7_

  - [x] 5.4 Create `src/components/EmptyState.tsx`
    - Implement `EmptyStateProps` with `icon`, `title`, `description`, and optional `action` (`{ label, onClick }`)
    - Render centered placeholder with icon, message, and optional CTA button
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.5 Create `src/components/VariableList.tsx`
    - Implement `VariableListProps` with `variables` string array
    - Display a list of detected `{{variable_name}}` placeholders
    - _Requirements: 9.1, 9.2, 6.6_

- [x] 6. Create layout components (AppShell, TopBar, Sidebar)
  - [x] 6.1 Create `src/components/TopBar.tsx`
    - Implement `TopBarProps` with `searchQuery`, `onSearchChange`, `onCommandPaletteOpen`, and optional `syncStatus`
    - Render fixed top bar with: macOS traffic light placeholders (three colored circles), "PromptDock" title, centered search bar with ⌘K shortcut hint, sync badge and account icon using lucide-react (`RefreshCw`, `User`)
    - Use semantic HTML and ARIA labels for icon-only buttons
    - _Requirements: 2.1, 9.3, 9.4, 10.5, 1.6_

  - [x] 6.2 Create `src/components/Sidebar.tsx`
    - Implement `SidebarProps` with `folders`, `activeItem`, `onItemSelect`, and `promptCountByFolder`
    - Render `<nav>` with sections: Library (home), Folders (with item counts), Tags, Workspaces
    - Selected item gets `bg-[var(--color-primary)]/10` background with smooth transition
    - Use `<button>` elements for items with `aria-selected` attribute
    - _Requirements: 2.2, 2.6, 9.3, 9.4, 11.2_

  - [x] 6.3 Create `src/components/AppShell.tsx` with useReducer state management
    - Define `Screen`, `AppState`, `AppAction`, and `FilterType` types matching the design document
    - Implement the `appReducer` pure function handling all actions: `NAVIGATE`, `SELECT_PROMPT`, `SET_SEARCH`, `SET_FILTER`, `TOGGLE_FAVORITE`, `SET_SIDEBAR_ITEM`, `OPEN_COMMAND_PALETTE`, `CLOSE_COMMAND_PALETTE`, `OPEN_VARIABLE_FILL`, `CLOSE_VARIABLE_FILL`
    - Export the reducer function separately for testability
    - Initialize state with mock data from `src/data/mock-data.ts`
    - Register global `⌘K` / `Ctrl+K` keyboard shortcut via `useEffect` + `keydown` listener with `e.preventDefault()`
    - Implement search filtering logic: case-insensitive substring match against `title`, `description`, and `tags`
    - Implement filter chip logic: "All" (no filter), "Favorites" (`favorite === true`), "Recent" (sorted by `lastUsedAt`)
    - Implement sidebar folder filtering by `folderId`
    - Use `useMemo` for computed filtered prompts
    - Render TopBar, Sidebar, MainContentArea (switching between screens), InspectorPanel (conditional on Library screen with selected prompt), and modal overlays (CommandPalette, VariableFillModal)
    - Add `TODO` comments at integration points for backend persistence, Tauri commands, and Firebase auth
    - Structure component props and callbacks to accept async functions for future backend wiring
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.4, 5.5, 10.1, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4_

- [x] 7. Checkpoint — Verify layout and navigation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create screen components
  - [x] 8.1 Create `src/components/OnboardingScreen.tsx`
    - Implement `OnboardingScreenProps` with `onComplete` callback accepting `'local' | 'sync' | 'signin'`
    - Render centered welcome card with PromptDock logo (lucide-react `Rocket` or `Zap` icon) and "Welcome to PromptDock" heading
    - Render three option cards: "Start locally" (local-first), "Enable sync" (cloud), "Sign in" (existing account) — each clickable, calling `onComplete` with the appropriate choice
    - Render four benefit cards: "Store prompt recipes", "Fill variables", "Paste anywhere", "Works offline"
    - Render footer: "Private by design. You're in control."
    - Use Card component, Primary_Blue accent, white surfaces, soft shadows, rounded corners
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 8.2 Create `src/components/PromptCard.tsx` (redesigned, replacing existing)
    - Implement `PromptCardProps` with `prompt`, `categoryColor`, `isSelected`, `onSelect`, `onToggleFavorite`
    - Render: IconTile (colored category icon), title, truncated description, TagPills, relative timestamp, favorite star icon (outlined/filled yellow toggle)
    - Selected state: blue border (`#2563EB`) + small checkmark indicator
    - Hover: subtle shadow elevation change with smooth transition
    - Use `aria-selected` for selected state
    - _Requirements: 5.6, 5.7, 5.8, 9.3, 9.4, 11.1_

  - [x] 8.3 Create `src/components/PromptGrid.tsx`
    - Implement `PromptGridProps` with `prompts`, `selectedPromptId`, `onSelectPrompt`, `onToggleFavorite`, `categoryColorMap`
    - Render two-column responsive grid (`grid-cols-1 md:grid-cols-2`) of PromptCards
    - Show EmptyState when prompts array is empty
    - _Requirements: 5.3, 9.1_

  - [x] 8.4 Create `src/components/PromptInspector.tsx`
    - Implement `PromptInspectorProps` with `prompt`, `folder`, and `variables`
    - Render `<aside>` with: full title, description, metadata list (folder, tags, created date, last used date), scrollable body preview, and VariableList
    - _Requirements: 2.4, 5.9, 9.3_

  - [x] 8.5 Create `src/components/LibraryScreen.tsx` (new, composing header + filters + grid)
    - Render header with: "All Prompts" title, prompt count, grid/list view toggle (icon buttons), "+ New Prompt" button styled with Primary_Blue
    - Render filter chips below header: "All", "Favorites", "Recent", "Filters" — each clickable with active state styling
    - Compose PromptGrid with filtered prompts
    - Accept props for prompts, filters, search, selected prompt, and all callbacks from AppShell
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.6 Create `src/components/PromptEditor.tsx` (redesigned, replacing existing)
    - Implement `PromptEditorProps` with `promptId`, `prompt`, `folders`, `onSave`, `onCancel`
    - Render breadcrumb navigation showing path back to Library
    - Left column: form fields — Title (Input with character counter), Description (Input with character counter), Tags (TagPill list with add/remove), Folder (Select dropdown), Favorite (Toggle), Body editor (Textarea with line numbers, monospace font `var(--font-mono)`, variable highlighting rendering `{{variable_name}}` in blue with distinct background), footer with formatting help, word count, and character count
    - Right column: live preview panel — rendered body with sample variable values, detected VariableList, tips card with prompt writing guidance
    - Implement real-time updates: body changes update variable highlighting, detected variables, and live preview
    - Implement helper functions: `extractVariables(body: string): string[]`, `countWords(text: string): number`, `countChars(text: string): number`
    - Export helper functions for testability
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 8.7 Create `src/components/SettingsScreen.tsx` (redesigned, replacing existing)
    - Implement `SettingsScreenProps` with `onBack` callback
    - Left column: navigation with section links — "Account & Sync", "Appearance", "Hotkey", "Default Behavior", "Import/Export", "About"
    - Right column: setting cards for each section
    - AccountCard: avatar placeholder, email, verified badge
    - SyncCard: three state cards — "Sync off" (local only), "Guest cloud" (anonymous), "Signed in" (full sync) — clearly communicating sign-in is optional
    - AppearanceCard: theme selection (Light/Dark/System) with selectable option cards, density control
    - HotkeyCard: key capture input for global hotkey
    - ImportExportCard: export and import buttons
    - AboutCard: app version info
    - Clicking a nav section scrolls to or displays the corresponding card
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 9. Create modal overlay components
  - [x] 9.1 Create `src/components/CommandPalette.tsx`
    - Implement `CommandPaletteProps` with `prompts`, `isOpen`, `onClose`, `onSelectPrompt`
    - Render dimmed backdrop overlay with fade-in transition
    - Render `<dialog>` element with `role="dialog"` and `aria-modal="true"`
    - Auto-focus search input on open
    - Filter results in real time as user types (case-insensitive match on title, description, tags)
    - Implement keyboard navigation: ↑/↓ to move highlight (clamped to [0, N-1]), Enter to select, Escape to close
    - Show keyboard shortcut hints (↑↓ navigate, Enter select, Esc close)
    - Return focus to previously focused element on close
    - Export the `useArrowNavigation` hook or navigation logic for testability
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 11.4_

  - [x] 9.2 Create `src/components/VariableFillModal.tsx` (redesigned, replacing existing)
    - Implement `VariableFillModalProps` with `prompt`, `variables`, `onCancel`, `onCopy`, `onPaste`
    - Render modal form with input fields for each detected variable
    - Render live preview of the prompt body with variable values filled in
    - Render action buttons: "Cancel" (Esc hint), "Paste" (⌘V hint), "Copy final prompt" (⌘↵ hint)
    - Implement "Copied!" success state on copy button — show checkmark icon and "Copied!" text for ~2 seconds, then revert
    - Render floating hint: "Built for speed. Use ⌘V to paste anywhere."
    - Disable Copy/Paste buttons when not all variables are filled
    - Add `TODO` comments for Tauri clipboard integration
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 9.4, 11.3, 13.2_

- [x] 10. Wire AppShell to all screens and update App entry point
  - [x] 10.1 Integrate all screens and modals into `src/components/AppShell.tsx`
    - Import and render OnboardingScreen, LibraryScreen (with PromptGrid + PromptInspector), PromptEditor, SettingsScreen based on current screen state
    - Wire CommandPalette and VariableFillModal as overlay modals controlled by AppShell state
    - Ensure navigation flows: Onboarding → Library, Library ↔ Editor, Library ↔ Settings, ⌘K → CommandPalette → VariableFillModal
    - Ensure selecting a prompt with variables in CommandPalette opens VariableFillModal; prompts without variables go directly to copy action
    - Ensure search in TopBar filters LibraryScreen's PromptGrid in real time
    - Ensure Tab key moves focus through interactive elements in logical reading order
    - _Requirements: 2.3, 2.4, 2.5, 5.4, 7.5, 10.1, 10.6, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 10.2 Update `src/App.tsx` to render the new AppShell
    - Replace the existing `AppShell` component usage with the new `src/components/AppShell.tsx`
    - Keep the existing initialization logic but route to the new UI
    - Ensure the app renders the new design when loaded
    - _Requirements: 12.1_

- [x] 11. Checkpoint — Verify all screens render and navigate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Property-based tests
  - [x] 12.1 Write property test: Navigation reducer produces valid screen state
    - Create `src/components/__tests__/app-reducer.property.test.ts`
    - **Property 1: Navigation reducer produces valid screen state**
    - For any valid AppState and any valid AppAction, the reducer produces a new AppState where `screen.name` is one of `onboarding`, `library`, `editor`, `settings`; `selectedPromptId` is `null` or a string; and all fields remain in valid domains
    - Use `fast-check` arbitraries to generate random AppState and AppAction values
    - Minimum 100 iterations
    - **Validates: Requirements 2.5, 12.1, 12.2, 12.4**

  - [x] 12.2 Write property test: Search filtering returns only matching prompts
    - Create `src/components/__tests__/search-filter.property.test.ts`
    - **Property 2: Search filtering returns only matching prompts**
    - For any non-empty search query and any list of PromptRecipe objects, every returned prompt contains the query as a case-insensitive substring in title, description, or tags; no matching non-archived prompt is excluded
    - Use `fast-check` to generate random query strings and prompt arrays
    - Minimum 100 iterations
    - **Validates: Requirements 5.4, 7.4, 12.5**

  - [x] 12.3 Write property test: Favorites filter returns only favorited prompts
    - Create `src/components/__tests__/favorites-filter.property.test.ts`
    - **Property 3: Favorites filter returns only favorited prompts**
    - For any list of PromptRecipe objects, the favorites filter returns exactly the subset where `favorite === true`
    - Minimum 100 iterations
    - **Validates: Requirements 5.5**

  - [x] 12.4 Write property test: Variable extraction from template strings
    - Create `src/components/__tests__/variable-extraction.property.test.ts`
    - **Property 4: Variable extraction from template strings**
    - For any template string with `{{variable_name}}` placeholders, extraction returns exactly the unique variable names in first-appearance order; round-trip reconstruction preserves the original string
    - Minimum 100 iterations
    - **Validates: Requirements 6.3, 6.6, 6.8**

  - [x] 12.5 Write property test: Word count and character count correctness
    - Create `src/components/__tests__/text-counts.property.test.ts`
    - **Property 5: Word count and character count correctness**
    - For any string, character count equals `.length`; word count equals non-empty tokens from whitespace split; empty string yields zero for both
    - Minimum 100 iterations
    - **Validates: Requirements 6.4**

  - [x] 12.6 Write property test: State preservation across editor round-trip navigation
    - Create `src/components/__tests__/navigation-state.property.test.ts`
    - **Property 6: State preservation across editor round-trip navigation**
    - For any AppState with non-empty searchQuery and any activeFilter, navigating Library → Editor → Library preserves searchQuery and activeFilter
    - Minimum 100 iterations
    - **Validates: Requirements 12.3**

  - [x] 12.7 Write property test: Arrow key navigation stays within bounds
    - Create `src/components/__tests__/arrow-navigation.property.test.ts`
    - **Property 7: Arrow key navigation stays within bounds**
    - For any list of N results (N ≥ 1) and any sequence of ↑/↓ presses, highlighted index stays in [0, N-1]
    - Minimum 100 iterations
    - **Validates: Requirements 10.3**

  - [x] 12.8 Write property test: Variable fill modal appears iff prompt has variables
    - Create `src/components/__tests__/variable-fill-condition.property.test.ts`
    - **Property 8: Variable fill modal appears if and only if prompt has variables**
    - For any PromptRecipe, the variable fill modal should display iff the body contains at least one `{{variable_name}}` placeholder
    - Minimum 100 iterations
    - **Validates: Requirements 7.5**

- [x] 13. Example-based unit tests
  - [x] 13.1 Write unit tests for base UI primitives
    - Create `src/components/ui/__tests__/Button.test.tsx` — renders all variants, handles click, shows disabled state, has focus ring
    - Create `src/components/ui/__tests__/Input.test.tsx` — renders label, shows error/hint, handles change
    - Create `src/components/ui/__tests__/Toggle.test.tsx` — toggles on click, respects disabled, has correct ARIA (`role="switch"`, `aria-checked`)
    - Create `src/components/ui/__tests__/Card.test.tsx` — renders children, applies padding variants
    - _Requirements: 1.4, 9.2, 9.4_

  - [x] 13.2 Write unit tests for utility components
    - Create `src/components/__tests__/TagPill.test.tsx` — renders tag name, calls onRemove
    - Create `src/components/__tests__/IconTile.test.tsx` — renders icon with color background
    - Create `src/components/__tests__/SyncStatusBadge.test.tsx` — renders correct icon and text for each status
    - Create `src/components/__tests__/EmptyState.test.tsx` — renders title/description, optional action button
    - Create `src/components/__tests__/VariableList.test.tsx` — renders variable names
    - _Requirements: 9.1, 9.7_

  - [x] 13.3 Write unit tests for layout components
    - Create `src/components/__tests__/TopBar.test.tsx` — renders traffic lights, search bar, ⌘K hint, sync/account icons
    - Create `src/components/__tests__/Sidebar.test.tsx` — renders sections, highlights selected item, shows folder counts
    - Create `src/components/__tests__/AppShell.test.tsx` — renders TopBar + Sidebar + MainContent, ⌘K opens palette, navigation works
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 10.1_

  - [x] 13.4 Write unit tests for screen components
    - Create `src/components/__tests__/OnboardingScreen.test.tsx` — renders 3 options + 4 benefits, navigates on click
    - Create `src/components/__tests__/LibraryScreen.test.tsx` — renders header + filters + grid, search filters in real time
    - Create `src/components/__tests__/PromptCard.test.tsx` — renders all fields, toggles favorite, shows selected state
    - Create `src/components/__tests__/PromptGrid.test.tsx` — renders cards in grid, handles empty state
    - Create `src/components/__tests__/PromptInspector.test.tsx` — shows prompt details, lists variables
    - Create `src/components/__tests__/PromptEditor.test.tsx` — renders form + preview, variable highlighting, char/word counts
    - Create `src/components/__tests__/SettingsScreen.test.tsx` — renders nav + cards, scrolls to section on nav click
    - _Requirements: 4.1–4.6, 5.1–5.9, 6.1–6.8, 8.1–8.8_

  - [x] 13.5 Write unit tests for modal components
    - Create `src/components/__tests__/CommandPalette.test.tsx` — auto-focuses input, filters results, keyboard navigation (↑↓ Enter Esc), closes and returns focus
    - Create `src/components/__tests__/VariableFillModal.test.tsx` — renders variable inputs, shows preview, copy success state, disables buttons when variables unfilled
    - _Requirements: 7.1–7.8, 10.2, 10.3, 10.4_

  - [x] 13.6 Write unit tests for mock data module
    - Create `src/data/__tests__/mock-data.test.ts` — verify 6 prompts exist, 4 folders exist, all prompts have valid structure (required fields, body contains `{{...}}` placeholders), category map covers all prompts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major phase
- Property tests validate universal correctness properties from the design document using `fast-check`
- Unit tests validate specific rendering, interactions, and edge cases using `vitest`
- The existing `src/components/`, `src/screens/`, and `src/App.tsx` files will be replaced/redesigned — the new components supersede the old ones
- All integration points are marked with `TODO` comments for future backend wiring
- `lucide-react` is the sole new runtime dependency; `fast-check` and `vitest` are already in devDependencies
