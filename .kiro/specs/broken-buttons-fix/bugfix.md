# Bugfix Requirements Document

## Introduction

Many interactive buttons across the PromptDock application are non-functional. Buttons render visually but have no `onClick` handlers or only close a dropdown menu without performing their labeled action. This affects core workflows: users cannot duplicate, archive, copy, delete, or favorite prompts from the inspector panel; cannot use action buttons in the prompt editor's edit mode; and encounter dead buttons in the sidebar, top bar, and library screen. The Zustand prompt store already exposes the necessary CRUD actions (`duplicatePrompt`, `archivePrompt`, `deletePrompt`, `toggleFavorite`, `updatePrompt`) and the `copyToClipboard` utility exists, but these are not wired to the UI buttons. In AppShell, `handleArchivePrompt` and `handleDuplicatePrompt` callbacks are defined but never passed to child components.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the Duplicate, Archive, or Copy buttons in PromptEditor edit mode (lines 307-318) THEN the system does nothing because the buttons have no onClick handlers

1.2 WHEN a user clicks any dropdown menu item (Edit prompt, Duplicate, Move to folder, Archive, Delete) in PromptInspector THEN the system only closes the dropdown menu without performing the labeled action

1.3 WHEN a user clicks the favorite star button in PromptInspector THEN the system does nothing because the button has no onClick handler

1.4 WHEN a user clicks the "Copy prompt body" button in PromptInspector THEN the system does nothing because the button has no onClick handler

1.5 WHEN a user clicks the "Add tag" button in PromptInspector THEN the system does nothing because the button has no onClick handler

1.6 WHEN a user clicks the "Filters" button in LibraryScreen THEN the system does nothing because the button has no onClick handler

1.7 WHEN a user clicks the "New Prompt" dropdown ChevronDown button in LibraryScreen THEN the system does nothing because the button has no onClick handler

1.8 WHEN a user clicks either "More…" button (Folders or Tags sections) in Sidebar THEN the system does nothing because the buttons have no onClick handlers

1.9 WHEN a user clicks the Sync/Refresh button in TopBar THEN the system does nothing because the button has no onClick handler

1.10 WHEN a user clicks the Save options ChevronDown button in PromptEditor THEN the system does nothing because the button has no onClick handler

### Expected Behavior (Correct)

2.1 WHEN a user clicks the Duplicate button in PromptEditor edit mode THEN the system SHALL call the store's `duplicatePrompt` action with the current prompt ID and navigate back to the library

2.2 WHEN a user clicks the Archive button in PromptEditor edit mode THEN the system SHALL call the store's `archivePrompt` action with the current prompt ID and navigate back to the library

2.3 WHEN a user clicks the Copy button in PromptEditor edit mode THEN the system SHALL copy the prompt body text to the clipboard using `copyToClipboard` and show a success toast

2.4 WHEN a user clicks "Edit prompt" in the PromptInspector dropdown menu THEN the system SHALL navigate to the editor screen with the current prompt loaded for editing

2.5 WHEN a user clicks "Duplicate" in the PromptInspector dropdown menu THEN the system SHALL call the store's `duplicatePrompt` action with the current prompt ID

2.6 WHEN a user clicks "Archive" in the PromptInspector dropdown menu THEN the system SHALL call the store's `archivePrompt` action with the current prompt ID and deselect the prompt

2.7 WHEN a user clicks "Delete" in the PromptInspector dropdown menu THEN the system SHALL call the store's `deletePrompt` action with the current prompt ID and deselect the prompt

2.8 WHEN a user clicks the favorite star button in PromptInspector THEN the system SHALL call the store's `toggleFavorite` action with the current prompt ID

2.9 WHEN a user clicks the "Copy prompt body" button in PromptInspector THEN the system SHALL copy the prompt body to the clipboard using `copyToClipboard` and show a success toast

2.10 WHEN a user clicks the Sync/Refresh button in TopBar THEN the system SHALL trigger a prompt reload by calling the store's `loadPrompts` action

2.11 WHEN a user clicks the Save options ChevronDown button in PromptEditor THEN the system SHALL open a dropdown menu with save-related options (e.g., "Save and Close", "Save as New")

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks the main "Save" button in PromptEditor THEN the system SHALL CONTINUE TO save the prompt data via the `onSave` callback

3.2 WHEN a user clicks the "Cancel" breadcrumb link in PromptEditor THEN the system SHALL CONTINUE TO navigate back to the library via the `onCancel` callback

3.3 WHEN a user clicks the main "New Prompt" button (not the ChevronDown) in LibraryScreen THEN the system SHALL CONTINUE TO trigger the `onNewPrompt` callback to open the editor

3.4 WHEN a user clicks a filter chip (All, Favorites, Recent) in LibraryScreen THEN the system SHALL CONTINUE TO apply the selected filter via `onFilterChange`

3.5 WHEN a user clicks a prompt card in the library grid THEN the system SHALL CONTINUE TO select the prompt and show it in the inspector panel

3.6 WHEN a user clicks a sidebar navigation item (All Prompts, Favorites, Recent, Archived, or a folder) THEN the system SHALL CONTINUE TO filter the library view accordingly

3.7 WHEN a user clicks the Settings button in the sidebar or TopBar THEN the system SHALL CONTINUE TO navigate to the settings screen

3.8 WHEN a user types in the search bar in TopBar THEN the system SHALL CONTINUE TO filter prompts by the search query

3.9 WHEN a user clicks the "More options" (three-dot) button in PromptInspector THEN the system SHALL CONTINUE TO toggle the dropdown menu open/closed

3.10 WHEN a user clicks the grid/list view toggle buttons in LibraryScreen THEN the system SHALL CONTINUE TO switch between grid and list view modes
