# Requirements Document

## Introduction

PromptDock is a cross-platform desktop application for managing reusable AI prompt recipes. It provides a "Raycast for AI prompts" experience: users press a global hotkey, search their prompt library, fill template variables, and copy or paste the final prompt into any active application. The app uses Tauri 2 for the desktop shell, React + TypeScript for the frontend, Vite for the build system, Tailwind CSS for styling, and optionally Firebase Auth and Cloud Firestore for cross-device sync. PromptDock is local-first: all core functionality — creating, editing, searching, and using prompts — works fully without an account. Sign-in is an opt-in feature that enables syncing prompts across devices via Cloud Firestore with offline persistence. The app operates in two primary modes: Local Mode (default, no account required) and Synced Mode (signed-in, prompts sync to Firestore).

## Glossary

- **PromptDock**: The desktop application being specified
- **Prompt_Recipe**: A reusable AI prompt template that may contain variables, along with metadata such as title, description, tags, and folder assignment
- **Variable**: A placeholder in a Prompt_Recipe template using the `{{variable_name}}` syntax that the user fills before generating the final prompt
- **Variable_Parser**: The component responsible for extracting variable placeholders from a Prompt_Recipe template string
- **Prompt_Renderer**: The component responsible for substituting variable values into a Prompt_Recipe template to produce the final prompt text
- **Workspace**: An organizational container that groups Prompt_Recipes and folders; in Local Mode a single default workspace exists on disk; in Synced Mode workspaces sync to Firestore and support members
- **Workspace_Member**: A user associated with a Workspace in Synced Mode, with a role of owner, editor, or viewer
- **Folder**: A named grouping within a Workspace used to organize Prompt_Recipes
- **Quick_Launcher**: A lightweight overlay window activated by the global hotkey for rapid prompt search and selection
- **Global_Hotkey**: A system-wide keyboard shortcut (Cmd+Shift+P on macOS, Ctrl+Shift+P on Windows/Linux) that activates the Quick_Launcher
- **Clipboard_Service**: The component responsible for copying text to the system clipboard
- **Paste_Service**: The component responsible for programmatically pasting text into the currently active application
- **Local_Storage**: A local on-disk JSON-based store used in Local Mode to persist Prompt_Recipes, folders, and settings without requiring an account or network
- **Firestore_Repository**: An abstraction layer providing CRUD operations against Cloud Firestore collections, used only in Synced Mode
- **Prompt_Repository**: A repository abstraction for Prompt_Recipe documents that delegates to Local_Storage in Local Mode or Firestore_Repository in Synced Mode
- **Workspace_Repository**: A repository abstraction for Workspace documents
- **Settings_Repository**: A repository abstraction for user settings documents, backed by local storage or Firestore depending on mode
- **Sync_Status**: An indicator showing the current synchronization state: local-mode, synced, syncing, offline, or pending-changes
- **Conflict_Center**: A UI screen where users review and resolve prompt version conflicts (Synced Mode only)
- **Prompt_Conflict**: A document representing a detected version conflict between local and remote changes to a Prompt_Recipe (Synced Mode only)
- **Prompt_Version**: A historical snapshot of a Prompt_Recipe at a specific point in time
- **Auth_Service**: The component managing Firebase Auth operations including sign-up, sign-in, sign-out, session restore, and password reset; used only when the user opts in to sync
- **Local_Mode**: The default application mode where all prompts are stored locally on disk; no account or network required; full CRUD, search, hotkey, and clipboard functionality available
- **Synced_Mode**: An opt-in application mode where the user is authenticated and prompts sync to Cloud Firestore; enables cross-device access
- **Offline_Synced_Mode**: A sub-mode of Synced Mode where a previously authenticated user operates from the Firestore offline cache and syncs when connectivity returns
- **Search_Engine**: The component that performs local search against the loaded prompt collection, ranking results by title, tags, description, and body
- **Seed_Data**: A predefined set of sample Prompt_Recipes created in the default local workspace on first launch (not on sign-up)
- **Tray_Icon**: The system tray or menu-bar icon providing persistent access to PromptDock
- **Import_Export_Service**: The component responsible for importing and exporting Prompt_Recipes in JSON format with schema validation and duplicate detection

## Requirements

### Requirement 1: Local-First Prompt Management

**User Story:** As a user, I want to create, edit, search, and use prompts immediately after installing the app, so that I can be productive without creating an account.

#### Acceptance Criteria

1. WHEN the application launches for the first time, THE PromptDock SHALL start in Local_Mode with a default local workspace and sample Prompt_Recipes, requiring no sign-in
2. WHILE in Local_Mode, THE PromptDock SHALL persist all Prompt_Recipes, folders, and settings to Local_Storage on disk
3. WHILE in Local_Mode, THE PromptDock SHALL provide full CRUD operations on Prompt_Recipes, folder management, search, global hotkey, clipboard, and paste functionality
4. WHILE in Local_Mode, THE PromptDock SHALL NOT attempt any Firebase Auth or Firestore operations
5. WHEN the user has not signed in, THE PromptDock SHALL display the Main Library Screen as the default view (not an auth screen)

### Requirement 2: Optional Sign-In for Cross-Device Sync

**User Story:** As a user, I want to optionally sign in so that I can sync my prompts across multiple devices.

#### Acceptance Criteria

1. THE Settings Screen SHALL provide an option to sign in with email and password to enable cross-device sync
2. WHEN the user submits valid credentials on the Sign In form, THE Auth_Service SHALL authenticate the user and transition the app from Local_Mode to Synced_Mode
3. WHEN the user signs in for the first time, THE PromptDock SHALL offer to migrate existing local Prompt_Recipes to the user's Firestore-backed Workspace
4. IF the user declines migration, THEN THE PromptDock SHALL create a fresh Firestore-backed Workspace with Seed_Data and preserve the local prompts separately
5. WHEN the user signs in, THE Workspace_Repository SHALL create a personal Workspace document and a Workspace_Member document with the role of owner if they do not already exist
6. IF the sign-in request fails due to invalid credentials, THEN THE Auth_Service SHALL display an error message indicating the email or password is incorrect

### Requirement 3: Optional Account Creation

**User Story:** As a user, I want to create an account when I choose to, so that I can start syncing my prompts across devices.

#### Acceptance Criteria

1. THE Settings Screen SHALL provide an option to create a new account with email and password
2. WHEN the user submits a valid email and password on the Sign Up form, THE Auth_Service SHALL create a new Firebase Auth account and sign the user in, transitioning to Synced_Mode
3. WHEN the user successfully signs up, THE Auth_Service SHALL create a user document in the Firestore `users` collection containing the user's uid, email, display name, and creation timestamp
4. WHEN the user successfully signs up, THE PromptDock SHALL offer to migrate existing local Prompt_Recipes to the new Firestore-backed Workspace
5. IF the sign-up request fails due to an already-registered email, THEN THE Auth_Service SHALL display an error message indicating the email is already in use
6. IF the sign-up request fails due to a weak password, THEN THE Auth_Service SHALL display an error message indicating the password does not meet strength requirements

### Requirement 4: Sign Out and Password Reset

**User Story:** As a signed-in user, I want to sign out or reset my password, so that I can manage my account security.

#### Acceptance Criteria

1. WHEN the user selects sign out from the Settings Screen, THE Auth_Service SHALL sign the user out and transition the app back to Local_Mode
2. WHEN the user signs out, THE PromptDock SHALL restore the local workspace and local Prompt_Recipes that existed before sign-in (or were created in Local_Mode)
3. WHEN the user selects the forgot password option on the Sign In form, THE Auth_Service SHALL send a password reset email to the provided email address
4. IF the password reset request is submitted with an unregistered email, THEN THE Auth_Service SHALL display a generic confirmation message without revealing whether the email exists

### Requirement 5: Application Modes

**User Story:** As a user, I want the app to work seamlessly in different modes depending on my authentication and connectivity state, so that I always have access to my prompts.

#### Acceptance Criteria

1. THE PromptDock SHALL default to Local_Mode on first launch and on every launch where no authenticated session exists
2. WHILE in Local_Mode, THE PromptDock SHALL provide the complete feature set (CRUD, search, hotkey, clipboard, paste, import/export, settings) using Local_Storage
3. WHILE the user is authenticated and online, THE PromptDock SHALL operate in Synced_Mode and sync Prompt_Recipes with Cloud Firestore in real time
4. WHILE the user is authenticated and offline, THE PromptDock SHALL operate in Offline_Synced_Mode and serve Prompt_Recipes from the Firestore offline cache
5. WHEN connectivity is restored in Offline_Synced_Mode, THE PromptDock SHALL automatically sync pending local changes to Cloud Firestore
6. WHEN the application launches with a previously authenticated session, THE Auth_Service SHALL attempt to restore the session and transition to Synced_Mode if successful

### Requirement 6: Local Storage

**User Story:** As a user, I want my prompts saved locally on my computer, so that they persist between app launches without needing an account.

#### Acceptance Criteria

1. THE Local_Storage SHALL persist Prompt_Recipes, folders, and user settings as JSON files on disk in the application data directory
2. THE Local_Storage SHALL provide the same CRUD interface as the Firestore_Repository so that the Prompt_Repository can delegate transparently
3. WHEN a Prompt_Recipe is saved in Local_Mode, THE Local_Storage SHALL write the updated data to disk immediately
4. WHEN the application launches in Local_Mode, THE Local_Storage SHALL load all persisted Prompt_Recipes and folders from disk
5. FOR ALL valid Prompt_Recipe objects, writing to Local_Storage and reading back SHALL produce an equivalent object (round-trip property)

### Requirement 7: Firestore Data Model and Repository Abstraction

**User Story:** As a developer, I want a well-defined data model and repository abstraction, so that data access is consistent and testable across Local and Synced modes.

#### Acceptance Criteria

1. THE Prompt_Repository SHALL expose a unified interface that delegates to Local_Storage in Local_Mode or Firestore_Repository in Synced_Mode
2. THE Firestore_Repository SHALL support the following collections: users, workspaces, members, prompts, folders, promptVersions, conflicts, and settings
3. THE Prompt_Repository SHALL provide methods for creating, reading, updating, soft-deleting, listing, duplicating, favoriting, archiving, and restoring Prompt_Recipe documents
4. THE Workspace_Repository SHALL provide methods for creating, reading, updating, and listing Workspace documents filtered by the current user's membership
5. THE Settings_Repository SHALL provide methods for reading and updating user settings documents
6. WHEN a Prompt_Recipe is deleted, THE Prompt_Repository SHALL perform a soft delete by setting an `archived` flag and `archivedAt` timestamp rather than removing the document
7. THE Prompt_Repository SHALL convert Firestore documents to typed TypeScript objects using data converter functions
8. FOR ALL valid Prompt_Recipe TypeScript objects, converting to a Firestore document and back SHALL produce an equivalent object (round-trip property)

### Requirement 8: Firestore Offline Persistence

**User Story:** As a signed-in user, I want my synced prompts available even when I lose internet connectivity, so that I can continue working without interruption.

#### Acceptance Criteria

1. WHEN the application initializes in Synced_Mode, THE PromptDock SHALL enable Firestore persistent local cache using the Firebase modular SDK
2. WHILE offline in Synced_Mode, THE Prompt_Repository SHALL serve read requests from the local Firestore cache
3. WHILE offline in Synced_Mode, THE Prompt_Repository SHALL queue write operations locally and sync them when connectivity returns
4. WHEN the application is configured for local development, THE PromptDock SHALL connect Firebase Auth and Firestore to the Firebase Emulator Suite using environment variables

### Requirement 9: Firestore Security Rules

**User Story:** As a signed-in user, I want my synced data protected by access control rules, so that only authorized users can read or modify my prompts.

#### Acceptance Criteria

1. THE Firestore security rules SHALL allow a user to read and write only their own user document
2. THE Firestore security rules SHALL allow Workspace_Members to read Workspace documents they belong to
3. THE Firestore security rules SHALL allow only Workspace_Members with the owner or editor role to create, update, or soft-delete Prompt_Recipe documents within a Workspace
4. THE Firestore security rules SHALL allow only Workspace_Members with the owner role to delete a Workspace or modify Workspace_Member roles
5. THE Firestore security rules SHALL deny all read and write access to unauthenticated requests

### Requirement 10: Firestore Indexes

**User Story:** As a signed-in user, I want prompt queries to perform efficiently, so that search and listing operations are fast.

#### Acceptance Criteria

1. THE Firestore indexes SHALL support composite queries on Prompt_Recipe documents by workspaceId and archived status combined with ordering by updatedAt, lastUsedAt, or createdAt
2. THE Firestore indexes SHALL support composite queries on Prompt_Recipe documents by workspaceId, archived status, and favorite flag
3. THE Firestore indexes SHALL support composite queries on Prompt_Recipe documents by workspaceId, archived status, and tags array membership

### Requirement 11: Prompt Library CRUD

**User Story:** As a user, I want to create, view, edit, and manage my prompt recipes, so that I can build and maintain a personal prompt library.

#### Acceptance Criteria

1. WHEN the user submits the Prompt Editor form with a title and body, THE Prompt_Repository SHALL create a new Prompt_Recipe document in the current Workspace
2. WHEN the user opens an existing Prompt_Recipe, THE PromptDock SHALL display the Prompt Editor populated with the recipe's title, description, body, tags, and folder assignment
3. WHEN the user saves changes in the Prompt Editor, THE Prompt_Repository SHALL update the Prompt_Recipe document and set the `updatedAt` timestamp
4. WHEN the user selects duplicate on a Prompt_Recipe, THE Prompt_Repository SHALL create a new Prompt_Recipe document with the same content and a title prefixed with "Copy of"
5. WHEN the user selects favorite on a Prompt_Recipe, THE Prompt_Repository SHALL toggle the `favorite` flag on the document
6. WHEN the user selects archive on a Prompt_Recipe, THE Prompt_Repository SHALL set the `archived` flag to true and record the `archivedAt` timestamp
7. WHEN the user selects restore on an archived Prompt_Recipe, THE Prompt_Repository SHALL set the `archived` flag to false and clear the `archivedAt` timestamp

### Requirement 12: Variable Detection and Parsing

**User Story:** As a user, I want variables in my prompt templates automatically detected, so that I can fill them in before using the prompt.

#### Acceptance Criteria

1. THE Variable_Parser SHALL extract all unique variable names from a Prompt_Recipe template string by identifying substrings matching the `{{variable_name}}` pattern
2. THE Variable_Parser SHALL return variable names in the order of their first appearance in the template
3. THE Variable_Parser SHALL treat variable names as case-sensitive
4. WHEN a template contains duplicate variable placeholders, THE Variable_Parser SHALL return each variable name only once
5. WHEN a template contains no variable placeholders, THE Variable_Parser SHALL return an empty list
6. FOR ALL template strings, extracting variables and then reconstructing a template with those variables as placeholders SHALL preserve the set of detected variable names (round-trip property)

### Requirement 13: Prompt Rendering

**User Story:** As a user, I want to fill in variable values and generate the final prompt text, so that I can use customized prompts quickly.

#### Acceptance Criteria

1. WHEN the user provides values for all variables, THE Prompt_Renderer SHALL substitute each `{{variable_name}}` placeholder with the corresponding value to produce the final prompt text
2. IF the user has not provided a value for a required variable, THEN THE Prompt_Renderer SHALL return a validation error identifying the missing variable names
3. THE Prompt_Renderer SHALL replace all occurrences of a variable placeholder when the variable appears multiple times in the template
4. WHEN a template contains no variables, THE Prompt_Renderer SHALL return the template text unchanged
5. FOR ALL templates and complete variable value maps, rendering the template SHALL produce output that contains none of the original `{{variable_name}}` placeholders (no-placeholder property)
6. FOR ALL templates with no variables, rendering SHALL return text identical to the input template (identity property)

### Requirement 14: Fast Search

**User Story:** As a user, I want to search my prompt library instantly, so that I can find the right prompt without scrolling.

#### Acceptance Criteria

1. WHEN the user types a query in the search field, THE Search_Engine SHALL filter the loaded Prompt_Recipe collection and return matching results within 100 milliseconds for libraries of up to 1000 prompts
2. THE Search_Engine SHALL rank results by match quality with the following field priority: title (highest), tags, description, body (lowest)
3. WHEN the search query is empty, THE Search_Engine SHALL display all non-archived Prompt_Recipes in the current Workspace
4. THE Search_Engine SHALL perform case-insensitive matching
5. THE Search_Engine SHALL exclude archived Prompt_Recipes from search results
6. FOR ALL non-empty search queries that exactly match a Prompt_Recipe title, THE Search_Engine SHALL include that Prompt_Recipe in the results (recall property)

### Requirement 15: Global Hotkey and Quick Launcher

**User Story:** As a user, I want to press a global hotkey to instantly open a search window, so that I can find and use prompts without switching context.

#### Acceptance Criteria

1. WHEN the user presses Cmd+Shift+P on macOS or Ctrl+Shift+P on Windows/Linux, THE PromptDock SHALL open the Quick_Launcher window
2. WHEN the Quick_Launcher opens, THE PromptDock SHALL focus the search input field
3. WHEN the user presses Escape in the Quick_Launcher, THE PromptDock SHALL close the Quick_Launcher window
4. WHEN the user selects a Prompt_Recipe in the Quick_Launcher, THE PromptDock SHALL display the Variable Fill Modal if the recipe contains variables, or copy the prompt body to the clipboard if it contains no variables
5. THE Global_Hotkey SHALL be configurable through the Settings Screen

### Requirement 16: Clipboard and Paste Operations

**User Story:** As a user, I want to copy or paste the final prompt into any application, so that I can use my prompts seamlessly across tools.

#### Acceptance Criteria

1. WHEN the user selects "Copy" on a Prompt_Recipe, THE Clipboard_Service SHALL copy the prompt body text to the system clipboard
2. WHEN the user selects "Copy" after filling variables, THE Clipboard_Service SHALL copy the rendered prompt text to the system clipboard
3. WHEN the user selects "Copy and Close", THE Clipboard_Service SHALL copy the prompt text to the system clipboard and THE PromptDock SHALL close the Quick_Launcher window
4. WHEN the user selects "Paste into Active App", THE Paste_Service SHALL programmatically paste the prompt text into the currently focused application
5. IF the Paste_Service fails to paste into the active application, THEN THE PromptDock SHALL fall back to copying the text to the clipboard and display a notification indicating the text was copied instead

### Requirement 17: Sync Status Display

**User Story:** As a user, I want to see the current sync status, so that I know whether my prompts are local-only or synced across devices.

#### Acceptance Criteria

1. THE PromptDock SHALL display the current Sync_Status in the Main Library Screen header area
2. WHILE in Local_Mode, THE Sync_Status SHALL display "Local" with an option to sign in for sync
3. WHILE the user is authenticated and online with all changes synced, THE Sync_Status SHALL display "Synced"
4. WHILE the user is authenticated and online with pending local changes, THE Sync_Status SHALL display "Syncing"
5. WHILE the user is authenticated and offline, THE Sync_Status SHALL display "Offline" with a count of pending changes
6. THE Sync_Status SHALL display the timestamp of the last successful sync when in Synced_Mode

### Requirement 18: Conflict Detection and Resolution

**User Story:** As a signed-in user, I want to be notified of sync conflicts and resolve them, so that I do not lose any prompt changes.

#### Acceptance Criteria

1. WHEN a Prompt_Recipe is modified both locally and remotely between syncs, THE PromptDock SHALL create a Prompt_Conflict document recording both versions
2. WHEN unresolved conflicts exist, THE PromptDock SHALL display a conflict indicator badge in the Main Library Screen
3. WHEN the user opens the Conflict_Center, THE PromptDock SHALL display a list of all unresolved Prompt_Conflict documents with side-by-side comparison of local and remote versions
4. WHEN the user selects "Keep Local" on a conflict, THE Prompt_Repository SHALL overwrite the remote version with the local version and mark the Prompt_Conflict as resolved
5. WHEN the user selects "Keep Remote" on a conflict, THE Prompt_Repository SHALL discard the local version and mark the Prompt_Conflict as resolved

### Requirement 19: Import and Export

**User Story:** As a user, I want to import and export my prompts in JSON format, so that I can back up my library or share prompts with others.

#### Acceptance Criteria

1. WHEN the user selects export, THE Import_Export_Service SHALL generate a JSON file containing all non-archived Prompt_Recipes in the current Workspace with a defined schema
2. WHEN the user selects import and provides a JSON file, THE Import_Export_Service SHALL validate the file against the expected schema before importing
3. IF the imported JSON file does not conform to the expected schema, THEN THE Import_Export_Service SHALL display a validation error describing the schema violations
4. WHEN importing prompts, THE Import_Export_Service SHALL detect duplicates by comparing prompt titles and body content and prompt the user to skip or overwrite
5. FOR ALL exported JSON files, importing the exported file into an empty Workspace SHALL produce Prompt_Recipes equivalent to the originals (round-trip property)
6. FOR ALL valid Prompt_Recipe collections, exporting and then parsing the JSON output SHALL produce a valid JSON document conforming to the export schema (serialization property)

### Requirement 20: Settings Management

**User Story:** As a user, I want to configure application preferences, so that PromptDock works the way I prefer.

#### Acceptance Criteria

1. THE Settings Screen SHALL display account information (email and display name) when signed in, or a prompt to sign in for sync when in Local_Mode
2. THE Settings Screen SHALL provide a sign-out action when signed in, or sign-in and sign-up actions when in Local_Mode
3. THE Settings Screen SHALL allow the user to view and switch the active Workspace (Synced_Mode only; Local_Mode has a single default workspace)
4. THE Settings Screen SHALL allow the user to configure the Global_Hotkey key combination
5. THE Settings Screen SHALL allow the user to select a theme preference: light, dark, or system
6. THE Settings Screen SHALL allow the user to set the default action for prompt selection: copy to clipboard or paste into active app
7. THE Settings Screen SHALL display the current Sync_Status and last synced timestamp
8. THE Settings Screen SHALL provide access to import and export functionality

### Requirement 21: User Interface Screens

**User Story:** As a user, I want a clean and intuitive interface, so that I can manage my prompts efficiently.

#### Acceptance Criteria

1. THE PromptDock SHALL provide the following screens: Main Library Screen, Prompt Editor, Quick_Launcher Window, Variable Fill Modal, Settings Screen, and Conflict_Center (Synced_Mode only)
2. WHEN the application launches, THE PromptDock SHALL display the Main Library Screen as the default view regardless of authentication state
3. THE Main Library Screen SHALL display a list of Prompt_Recipes with title, description preview, tags, favorite indicator, and last-used timestamp
4. THE Main Library Screen SHALL provide filtering by folder and by favorite status
5. THE Variable Fill Modal SHALL display a labeled input field for each detected variable in the selected Prompt_Recipe
6. WHEN the user completes variable entry in the Variable Fill Modal, THE PromptDock SHALL render the final prompt and present copy and paste actions
7. THE Settings Screen SHALL embed sign-in and sign-up forms for users who want to enable sync, rather than presenting a separate Auth Screen

### Requirement 22: Tray and Window Management

**User Story:** As a user, I want PromptDock to run in the system tray, so that it is always accessible without cluttering my taskbar.

#### Acceptance Criteria

1. WHEN the application starts, THE PromptDock SHALL display a Tray_Icon in the system tray or menu bar
2. WHEN the user clicks the Tray_Icon, THE PromptDock SHALL toggle visibility of the main application window
3. WHEN the user closes the main application window, THE PromptDock SHALL minimize to the Tray_Icon rather than quitting the application
4. THE PromptDock SHALL provide a "Quit" option in the Tray_Icon context menu to fully exit the application

### Requirement 23: TypeScript Type Definitions

**User Story:** As a developer, I want well-defined TypeScript types, so that the codebase is type-safe and self-documenting.

#### Acceptance Criteria

1. THE PromptDock SHALL define TypeScript interfaces for: Prompt_Recipe, PromptVariable, Workspace, Workspace_Member, UserSettings, and Prompt_Conflict
2. THE Prompt_Recipe interface SHALL include fields for: id, workspaceId, title, description, body, tags, folderId, favorite, archived, archivedAt, createdAt, updatedAt, lastUsedAt, createdBy, and version
3. THE PromptVariable interface SHALL include fields for: name, defaultValue, and description
4. THE Workspace interface SHALL include fields for: id, name, ownerId, createdAt, and updatedAt
5. THE Workspace_Member interface SHALL include fields for: id, workspaceId, userId, role, and joinedAt
6. THE Prompt_Conflict interface SHALL include fields for: id, promptId, localVersion, remoteVersion, detectedAt, and resolvedAt

### Requirement 24: Seed Data

**User Story:** As a new user, I want sample prompts available immediately when I first open the app, so that I can understand how PromptDock works without signing in.

#### Acceptance Criteria

1. WHEN the application launches for the first time, THE Seed_Data service SHALL create the following sample Prompt_Recipes in the default local workspace: Summarize Text, Rewrite in Clear English, Generate Product Ideas, Code Review Assistant, Email Draft, and Meeting Notes Extractor
2. THE Seed_Data sample Prompt_Recipes SHALL include realistic template bodies with `{{variable_name}}` placeholders demonstrating the variable system
3. WHEN a user signs up and migrates local prompts to Synced_Mode, THE migrated collection SHALL include any remaining Seed_Data prompts that have not been deleted

### Requirement 25: Firebase Emulator Support

**User Story:** As a developer, I want to run the app against local Firebase emulators, so that I can develop and test sync features without affecting production data.

#### Acceptance Criteria

1. WHEN the environment variable `VITE_USE_EMULATOR` is set to `true`, THE PromptDock SHALL connect Firebase Auth to the local Auth emulator
2. WHEN the environment variable `VITE_USE_EMULATOR` is set to `true`, THE PromptDock SHALL connect Firestore to the local Firestore emulator
3. THE PromptDock SHALL read emulator host and port configuration from environment variables
4. WHEN the environment variable `VITE_USE_EMULATOR` is not set or is set to `false`, THE PromptDock SHALL connect to production Firebase services

### Requirement 26: Testing

**User Story:** As a developer, I want comprehensive unit tests, so that I can verify core logic is correct and prevent regressions.

#### Acceptance Criteria

1. THE test suite SHALL include unit tests for the Variable_Parser covering: single variable extraction, multiple variable extraction, duplicate variable deduplication, no-variable templates, and malformed placeholder handling
2. THE test suite SHALL include unit tests for the Prompt_Renderer covering: single variable substitution, multiple variable substitution, missing variable validation, no-variable passthrough, and multi-occurrence replacement
3. THE test suite SHALL include unit tests for the Search_Engine covering: title match ranking, tag match ranking, case-insensitive matching, archived prompt exclusion, and empty query behavior
4. THE test suite SHALL include unit tests for the Import_Export_Service covering: valid JSON export, valid JSON import, schema validation failure, and duplicate detection
5. THE test suite SHALL include unit tests for Local_Storage covering: write and read round-trip, loading on startup, and handling of corrupted files
6. THE test suite SHALL include unit tests for Firestore data converter functions covering round-trip conversion of Prompt_Recipe, Workspace, and UserSettings objects

### Requirement 27: Security and Privacy

**User Story:** As a user, I want my data handled securely and privately, so that I can trust PromptDock with my prompt content.

#### Acceptance Criteria

1. THE PromptDock SHALL not include any telemetry or analytics collection
2. THE PromptDock SHALL not store clipboard history beyond the current copy operation
3. THE PromptDock SHALL not embed or expose any admin credentials in the client application
4. THE PromptDock SHALL use soft deletes for all Prompt_Recipe deletion operations, preserving data for user-initiated recovery
5. THE PromptDock SHALL provide data export as the sole mechanism for users to extract their data
6. WHILE in Local_Mode, THE PromptDock SHALL store all data exclusively on the user's local file system with no network transmission

### Requirement 28: Project Scaffold and Deliverables

**User Story:** As a developer, I want a complete project scaffold, so that I can begin development with all infrastructure in place.

#### Acceptance Criteria

1. THE project scaffold SHALL include: package.json with all dependencies, Tauri 2 configuration, Vite configuration, Tailwind CSS configuration, and TypeScript configuration
2. THE project scaffold SHALL include: Firebase configuration module, Firestore repository implementations, Auth service implementation, Local_Storage implementation, and Firebase Emulator configuration
3. THE project scaffold SHALL include: firestore.rules file with security rules and firestore.indexes.json file with composite index definitions
4. THE project scaffold SHALL include: Rust source files for Tauri commands implementing global hotkey registration, clipboard operations, and window management
5. THE project scaffold SHALL include: React component files for all specified UI screens, a .env.example file with all required environment variables, and a README with setup and development instructions
6. THE project scaffold SHALL include: Vitest configuration and test files for all specified unit tests
