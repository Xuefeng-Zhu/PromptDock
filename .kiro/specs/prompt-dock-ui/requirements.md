# Requirements Document

## Introduction

This feature is a complete high-fidelity desktop UI redesign for PromptDock — an independent desktop app for storing, organizing, searching, filling, and quickly pasting reusable AI prompt recipes. The redesign replaces the existing functional-but-basic frontend with a polished, premium macOS-style productivity interface inspired by Raycast. The UI must feel fast, clean, keyboard-first, local-first, and trustworthy.

The existing Tauri 2 + React + TypeScript + Vite + Tailwind CSS 4 project already has backend services, repositories, stores, types, and basic UI screens. This feature focuses exclusively on replacing and upgrading the frontend UI layer. No backend changes are needed — all screens use mock data only for this UI pass. The existing types in `src/types/index.ts` (PromptRecipe, Folder, PromptVariable, UserSettings, etc.) are reused where applicable.

## Glossary

- **App_Shell**: The root layout component that orchestrates the top bar, sidebar, main content area, inspector panel, and modal layer
- **Top_Bar**: The macOS-style application header containing traffic light placeholders, app name, center search bar with ⌘K shortcut hint, and sync/account controls
- **Sidebar**: The left navigation panel containing Library, Folders, Tags, and Workspaces sections with item counts and selection highlighting
- **Main_Content_Area**: The central region displaying the active screen content (prompt grid, editor form, settings panels, or onboarding)
- **Inspector_Panel**: The optional right-side detail panel showing metadata, prompt preview, and variable information for a selected prompt
- **Command_Palette**: A modal overlay triggered by ⌘K that provides rapid prompt search, keyboard navigation, and selection
- **Variable_Fill_Modal**: A modal form that appears after selecting a prompt with variables, providing input fields for each variable and a rendered preview
- **Prompt_Card**: A card component displaying a prompt's colored icon tile, title, description, tags, timestamp, and favorite star
- **Prompt_Grid**: A two-column responsive grid layout for displaying Prompt_Cards with filter chips
- **Icon_Tile**: A small colored square with a pastel background and icon representing a prompt's category
- **Tag_Pill**: A small rounded badge displaying a tag name
- **Onboarding_Screen**: The first-run welcome screen with setup options and benefit cards
- **Library_Screen**: The main prompt browsing screen with header, filter chips, Prompt_Grid, and Inspector_Panel
- **Editor_Screen**: The prompt creation/editing screen with form fields, body editor with variable highlighting, and live preview
- **Quick_Launcher_Screen**: The command palette and variable fill overlay for rapid prompt access
- **Settings_Screen**: The settings and sync configuration screen with navigation column and setting cards
- **Mock_Data**: A static TypeScript file containing six predefined PromptRecipe objects used for UI development without backend dependencies
- **Design_Token**: A named color, spacing, or typography value from the design system (e.g., Primary_Blue #2563EB, Background #F8FAFC)
- **Focus_Ring**: A visible outline indicator shown on interactive elements when they receive keyboard focus

## Requirements

### Requirement 1: Design System and Token Foundation

**User Story:** As a developer, I want a centralized design token system and reusable base components, so that the entire UI is visually consistent and easy to maintain.

#### Acceptance Criteria

1. THE App_Shell SHALL define CSS custom properties or Tailwind theme extensions for all Design_Tokens: Primary_Blue (#2563EB), Background (#F8FAFC), Panel (#FFFFFF), Border (#E5E7EB), Muted_Text (#64748B), Main_Text (#0F172A), and category colors (Purple, Green, Yellow/Orange, Blue, Red/Orange, Teal)
2. THE App_Shell SHALL apply a light theme by default using the defined Design_Tokens
3. THE App_Shell SHALL structure its Tailwind configuration to support a future dark theme without requiring component-level changes
4. THE App_Shell SHALL provide reusable base UI components: Button, Input, Textarea, Select, Toggle, and Card, each styled with rounded corners, soft borders, and gentle shadows consistent with the design language
5. WHEN a user interacts with any interactive element using keyboard navigation, THE App_Shell SHALL display a visible Focus_Ring on the focused element
6. THE App_Shell SHALL use lucide-react for all iconography throughout the application

### Requirement 2: App Shell Layout

**User Story:** As a user, I want a structured desktop application layout with a top bar, sidebar, main content area, and optional inspector panel, so that I can navigate and use the app efficiently.

#### Acceptance Criteria

1. THE App_Shell SHALL render a fixed Top_Bar at the top of the window containing macOS-style traffic light placeholders (three colored circles), the app name "PromptDock", a centered search bar with a ⌘K shortcut hint, and sync/account control icons
2. THE App_Shell SHALL render a Sidebar on the left side of the window below the Top_Bar containing navigable sections for Library, Folders (with item counts), Tags, and Workspaces
3. THE App_Shell SHALL render the Main_Content_Area to the right of the Sidebar, filling the remaining horizontal space
4. THE App_Shell SHALL render an optional Inspector_Panel on the right side of the Main_Content_Area when a prompt is selected on the Library_Screen
5. THE App_Shell SHALL manage navigation state to switch the Main_Content_Area between Onboarding_Screen, Library_Screen, Editor_Screen, Quick_Launcher_Screen, and Settings_Screen
6. WHEN the user clicks a Sidebar item, THE Sidebar SHALL highlight the selected item with a soft blue background (#2563EB at 10% opacity) and update the Main_Content_Area accordingly

### Requirement 3: Mock Data Layer

**User Story:** As a developer, I want a static mock data file with realistic prompt data, so that all screens can be developed and demonstrated without backend dependencies.

#### Acceptance Criteria

1. THE Mock_Data SHALL contain exactly six PromptRecipe objects reusing the existing PromptRecipe type from `src/types/index.ts`: "Summarize Text" (tags: summarization, writing; folder: Writing; variables: audience, text, format), "Rewrite in Clear English" (tags: writing, editing; folder: Writing; variables: tone, text), "Generate Product Ideas" (tags: ideation, product; folder: Product; variables: problem, audience), "Code Review Assistant" (tags: code, review; folder: Engineering; variables: language, code), "Email Draft" (tags: email, writing; folder: Work; variables: recipient, tone, points), "Meeting Notes Extractor" (tags: notes, meeting; folder: Work; variables: transcript, format)
2. THE Mock_Data SHALL contain Folder objects for "Writing", "Product", "Engineering", and "Work"
3. THE Mock_Data SHALL assign each prompt a category color mapping: Summarize Text → Purple, Rewrite → Green, Ideas → Yellow/Orange, Code Review → Blue, Email Draft → Red/Orange, Meeting Notes → Teal
4. THE Mock_Data SHALL include realistic body templates with `{{variable_name}}` placeholders for each prompt
5. THE Mock_Data SHALL be importable as a standalone TypeScript module with no external dependencies beyond the project's type definitions

### Requirement 4: Onboarding Screen

**User Story:** As a new user, I want a welcoming first-run experience that explains PromptDock's value and lets me choose how to get started, so that I understand the app and feel confident using it.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL display a centered card containing the PromptDock logo and a "Welcome to PromptDock" heading
2. THE Onboarding_Screen SHALL display three option cards for getting started: "Start locally" (local-first storage), "Enable sync" (cloud synchronization), and "Sign in" (existing account)
3. THE Onboarding_Screen SHALL display four benefit cards describing key features: "Store prompt recipes", "Fill variables", "Paste anywhere", and "Works offline"
4. THE Onboarding_Screen SHALL display a footer with the text "Private by design. You're in control."
5. WHEN the user selects any of the three option cards, THE Onboarding_Screen SHALL navigate to the Library_Screen
6. THE Onboarding_Screen SHALL use the design language with white card surfaces, soft shadows, rounded corners, and the Primary_Blue accent color for interactive elements

### Requirement 5: Main Library Screen

**User Story:** As a user, I want to browse, search, and filter my prompt library in a visually rich grid layout, so that I can quickly find and select the prompt I need.

#### Acceptance Criteria

1. THE Library_Screen SHALL display a header containing the title "All Prompts", a prompt count, a grid/list view toggle, and a "+ New Prompt" button styled with Primary_Blue
2. THE Library_Screen SHALL display filter chips below the header: "All", "Favorites", "Recent", and "Filters"
3. THE Prompt_Grid SHALL display Prompt_Cards in a two-column responsive grid layout
4. WHEN the user types in the search bar, THE Library_Screen SHALL filter the displayed prompts in real time based on title, description, and tag matches
5. WHEN the user clicks a filter chip, THE Library_Screen SHALL filter the Prompt_Grid to show only matching prompts (favorites, recently used, or all)
6. THE Prompt_Card SHALL display a colored Icon_Tile (matching the prompt's category color), the prompt title, a truncated description, Tag_Pills, a relative timestamp, and a favorite star icon
7. WHEN the user clicks the favorite star on a Prompt_Card, THE Prompt_Card SHALL toggle the star between an outlined state and a filled yellow state
8. WHEN the user selects a Prompt_Card, THE Prompt_Card SHALL display a blue border (#2563EB) and a small checkmark indicator to show the selected state
9. WHEN a Prompt_Card is selected, THE Inspector_Panel SHALL appear on the right side showing the selected prompt's full title, description, metadata (folder, tags, created date, last used date), a scrollable prompt body preview, and a list of detected variables

### Requirement 6: Prompt Editor Screen

**User Story:** As a user, I want a rich prompt editing experience with variable highlighting and live preview, so that I can create and refine prompt templates effectively.

#### Acceptance Criteria

1. THE Editor_Screen SHALL display breadcrumb navigation showing the path back to the Library_Screen
2. THE Editor_Screen SHALL display form fields for: Title (with character counter), Description (with character counter), Tags (with add/remove interaction), Folder (dropdown select), and a Favorite toggle
3. THE Editor_Screen SHALL display a body editor with line numbers, monospace font, and variable highlighting that renders `{{variable_name}}` placeholders in blue (#2563EB) with a distinct background
4. THE Editor_Screen SHALL display a footer below the body editor containing formatting help text, word count, and character count
5. THE Editor_Screen SHALL display a right-side live preview panel that renders the prompt body with sample variable values filled in
6. THE Editor_Screen live preview panel SHALL display a list of detected variables extracted from the body template
7. THE Editor_Screen live preview panel SHALL display a tips card with helpful guidance for writing effective prompts
8. WHEN the user modifies the body text, THE Editor_Screen SHALL update the variable highlighting, detected variables list, and live preview in real time

### Requirement 7: Quick Launcher Screen

**User Story:** As a user, I want a fast command palette overlay for searching and pasting prompts with filled variables, so that I can use prompts without leaving my current workflow.

#### Acceptance Criteria

1. THE Quick_Launcher_Screen SHALL display a dimmed background overlay covering the entire viewport
2. THE Quick_Launcher_Screen SHALL display a Command_Palette modal in the center of the viewport containing a search input field with keyboard shortcut hints (↑↓ navigate, Enter select, Esc close)
3. WHEN the Command_Palette opens, THE Command_Palette SHALL focus the search input field by default
4. WHEN the user types in the Command_Palette search input, THE Command_Palette SHALL display filtered search results matching prompt titles, descriptions, and tags
5. WHEN the user selects a prompt that contains variables, THE Quick_Launcher_Screen SHALL display the Variable_Fill_Modal adjacent to the Command_Palette with input fields for each detected variable and a rendered preview
6. THE Quick_Launcher_Screen SHALL display action buttons: "Cancel" (with Esc hint), "Paste" (with ⌘V hint), and "Copy final prompt" (with ⌘↵ hint)
7. THE Quick_Launcher_Screen SHALL display a floating hint at the bottom: "Built for speed. Use ⌘V to paste anywhere."
8. WHEN the user clicks the "Copy final prompt" button, THE Quick_Launcher_Screen SHALL show a temporary success state on the button (e.g., checkmark icon and "Copied!" text) before reverting

### Requirement 8: Settings and Sync Screen

**User Story:** As a user, I want a comprehensive settings screen to manage my account, appearance, hotkeys, and data, so that I can customize PromptDock to my preferences.

#### Acceptance Criteria

1. THE Settings_Screen SHALL display a left navigation column with sections: "Account & Sync", "Appearance", "Hotkey", "Default Behavior", "Import/Export", and "About"
2. THE Settings_Screen SHALL display an Account card showing an avatar placeholder, email address, and a verified badge indicator
3. THE Settings_Screen SHALL display a Sync card with three state cards that clearly communicate the sync options: "Sync off" (local only), "Guest cloud" (anonymous sync), and "Signed in" (full sync with account)
4. THE Settings_Screen SHALL display an Appearance card with theme selection (Light, Dark, System) using selectable option cards and a density control
5. THE Settings_Screen SHALL display a Hotkey card for configuring the global hotkey combination with a key capture input
6. THE Settings_Screen SHALL display an Import/Export card with buttons for exporting and importing prompt data
7. WHEN the user clicks a section in the settings navigation column, THE Settings_Screen SHALL scroll to or display the corresponding settings card
8. THE Settings_Screen sync state cards SHALL clearly communicate that sign-in is optional and that local-only mode is fully functional

### Requirement 9: Reusable Component Library

**User Story:** As a developer, I want a set of reusable, well-typed UI components, so that screens can be composed consistently and new features can be built quickly.

#### Acceptance Criteria

1. THE App_Shell SHALL provide the following reusable components: AppShell, TopBar, Sidebar, PromptCard, PromptGrid, PromptInspector, PromptEditor, VariableList, VariableFillModal, CommandPalette, OnboardingScreen, SettingsScreen, SyncStatusBadge, TagPill, IconTile, EmptyState, Button, Input, Textarea, Select, Toggle, and Card
2. THE reusable components SHALL accept typed props using TypeScript interfaces
3. THE reusable components SHALL use semantic HTML elements (button for actions, nav for navigation, main for content, aside for sidebars, dialog for modals)
4. THE reusable components SHALL include appropriate ARIA attributes: aria-label for icon-only buttons, aria-expanded for expandable controls, aria-selected for selectable items, role="dialog" and aria-modal="true" for modals
5. THE reusable components SHALL render labeled inputs with associated label elements or aria-label attributes
6. THE reusable components SHALL maintain sufficient color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text) between text and background colors
7. THE reusable components SHALL not rely on color alone to convey status or state — each status SHALL have an accompanying text label or icon

### Requirement 10: Keyboard Navigation and Interaction

**User Story:** As a keyboard-focused user, I want all interactions to be accessible via keyboard, so that I can use PromptDock efficiently without a mouse.

#### Acceptance Criteria

1. WHEN the user presses ⌘K (or Ctrl+K on non-macOS), THE App_Shell SHALL open the Command_Palette modal
2. WHEN the Command_Palette is open and the user presses Escape, THE Command_Palette SHALL close and return focus to the previously focused element
3. WHEN the user presses ↑ or ↓ arrow keys in the Command_Palette search results, THE Command_Palette SHALL move the highlight between results
4. WHEN the user presses Enter on a highlighted Command_Palette result, THE Command_Palette SHALL select that prompt
5. THE App_Shell SHALL visually represent keyboard shortcuts alongside their corresponding actions (e.g., "⌘K" next to the search bar, "Esc" next to cancel buttons)
6. WHEN the user navigates using the Tab key, THE App_Shell SHALL move focus through interactive elements in a logical reading order

### Requirement 11: Visual Polish and Interaction Feedback

**User Story:** As a user, I want smooth visual feedback for my interactions, so that the app feels responsive and premium.

#### Acceptance Criteria

1. THE Prompt_Card SHALL display a subtle shadow elevation change on hover
2. THE Sidebar items SHALL display a smooth background color transition on hover and selection
3. WHEN a copy action completes, THE triggering button SHALL display a temporary success state (checkmark icon or "Copied!" text) for approximately two seconds before reverting to its default state
4. THE Command_Palette and Variable_Fill_Modal SHALL appear with a smooth fade-in transition over the dimmed backdrop
5. THE App_Shell SHALL use consistent border-radius values (rounded-lg or equivalent) across all cards, inputs, buttons, and modals
6. THE App_Shell SHALL use consistent spacing values derived from the Tailwind spacing scale across all layout sections and component internals

### Requirement 12: Screen Navigation and State Management

**User Story:** As a user, I want seamless navigation between screens with consistent state, so that I can move through the app without losing context.

#### Acceptance Criteria

1. THE App_Shell SHALL manage a current screen state that determines which screen (Onboarding, Library, Editor, Settings) is rendered in the Main_Content_Area
2. WHEN the user navigates from the Library_Screen to the Editor_Screen, THE App_Shell SHALL pass the selected prompt ID to the Editor_Screen for editing
3. WHEN the user navigates from the Editor_Screen back to the Library_Screen, THE App_Shell SHALL preserve the Library_Screen's previous search query and filter state
4. THE App_Shell SHALL manage a selected prompt state that is shared between the Library_Screen's Prompt_Grid and the Inspector_Panel
5. WHEN the user performs a search in the Top_Bar search input, THE App_Shell SHALL filter the Library_Screen's Prompt_Grid in real time
6. THE App_Shell SHALL use React state (useState/useReducer) for all UI state management without requiring external persistence, Firebase, or Tauri native commands

### Requirement 13: Integration Readiness

**User Story:** As a developer, I want clear integration points marked in the code, so that backend and native features can be connected in future passes.

#### Acceptance Criteria

1. THE App_Shell SHALL include TODO comments at each point where backend persistence will replace mock data (e.g., prompt CRUD operations, settings persistence)
2. THE App_Shell SHALL include TODO comments at each point where Tauri native commands will be integrated (e.g., clipboard operations, global hotkey registration, window management)
3. THE App_Shell SHALL include TODO comments at each point where Firebase authentication and sync will be connected
4. THE App_Shell SHALL structure its component props and callbacks to accept async functions, enabling future replacement of synchronous mock operations with asynchronous backend calls
