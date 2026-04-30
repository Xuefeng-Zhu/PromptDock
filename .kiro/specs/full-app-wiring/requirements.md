# Requirements Document

## Introduction

PromptDock is a local-first desktop prompt manager built with React, TypeScript, Tauri, and Firebase. The application architecture is approximately 70% complete: type system, Zustand stores, repository layer, core services, Firebase configuration, and UI components are all built. However, the critical wiring between these layers is missing. The AppShell component uses mock data and a local useReducer instead of the real Zustand stores. Settings, authentication, sync, Tauri native commands, and import/export are not connected to the UI. This spec covers all work required to make PromptDock a fully functional application.

## Glossary

- **AppShell**: The root layout component that orchestrates navigation, screen rendering, and shared UI state.
- **PromptStore**: The Zustand store managing prompt CRUD operations, search, and filter state, backed by PromptRepository.
- **SettingsStore**: The Zustand store managing user preferences (theme, hotkey, default action), backed by SettingsRepository.
- **AppModeStore**: The Zustand store managing application mode (local, synced, offline-synced), user ID, online status, and sync status.
- **PromptRepository**: The data access layer that persists PromptRecipe objects via LocalStorageBackend or FirestoreBackend.
- **LocalStorageBackend**: The Tauri Store plugin-based persistence layer for local data.
- **AuthService**: The Firebase Authentication service handling sign-up, sign-in, sign-out, session restore, and auth state observation.
- **SyncService**: The service managing Firestore real-time sync, mode transitions, migration, and conflict detection.
- **ConflictService**: The service managing detection and resolution of sync conflicts between local and remote prompt versions.
- **ImportExportService**: The service for serializing prompts to JSON and importing prompts from JSON files.
- **SettingsScreen**: The settings UI component with sections for account, sync, appearance, hotkey, default behavior, and import/export.
- **OnboardingScreen**: The first-run screen where users choose local mode, guest sync, or sign-in.
- **QuickLauncherWindow**: A secondary Tauri window for rapid prompt search and paste, toggled via global hotkey.
- **Tauri_Command**: A Rust function exposed to the frontend via Tauri's invoke handler (copy_to_clipboard, paste_to_active_app, register_hotkey, toggle_quick_launcher, etc.).
- **PromptRecipe**: The core data model representing a prompt with title, description, body, tags, folder, favorite status, and version metadata.
- **VariableFillModal**: The modal overlay for filling template variables before copying or pasting a prompt.

## Requirements

### Requirement 1: Replace Mock Data with PromptStore in AppShell

**User Story:** As a user, I want my prompt library to persist across sessions, so that prompts I create, edit, or delete are saved permanently.

#### Acceptance Criteria

1. WHEN the AppShell component mounts, THE AppShell SHALL read prompts and folders from the PromptStore instead of MOCK_PROMPTS and MOCK_FOLDERS.
2. WHEN a user creates a new prompt via the editor, THE AppShell SHALL call PromptStore.createPrompt to persist the prompt through the PromptRepository.
3. WHEN a user saves edits to an existing prompt, THE AppShell SHALL call PromptStore.updatePrompt with the prompt ID and changed fields.
4. WHEN a user toggles the favorite status of a prompt, THE AppShell SHALL call PromptStore.toggleFavorite to persist the change.
5. WHEN a user archives a prompt, THE AppShell SHALL call PromptStore.archivePrompt to soft-delete the prompt.
6. WHEN a user duplicates a prompt, THE AppShell SHALL call PromptStore.duplicatePrompt to create a persisted copy.
7. THE AppShell SHALL remove the internal useReducer-based state management for prompts and replace it with PromptStore selectors.
8. WHEN the PromptStore state changes, THE AppShell SHALL re-render with the updated prompt list without requiring a page refresh.

### Requirement 2: Wire SettingsScreen to SettingsStore

**User Story:** As a user, I want my settings changes to persist across app restarts, so that I do not have to reconfigure preferences each time.

#### Acceptance Criteria

1. WHEN the SettingsScreen mounts, THE SettingsScreen SHALL read current settings values (theme, hotkey, defaultAction) from the SettingsStore.
2. WHEN a user changes the theme preference, THE SettingsScreen SHALL call SettingsStore.updateSettings with the new theme value.
3. WHEN a user changes the global hotkey combination, THE SettingsScreen SHALL call SettingsStore.updateSettings with the new hotkeyCombo value.
4. WHEN a user changes the default action (copy or paste), THE SettingsScreen SHALL call SettingsStore.updateSettings with the new defaultAction value.
5. THE SettingsScreen SHALL remove all local useState-based mock state and read exclusively from the SettingsStore.

### Requirement 3: Wire Tauri Clipboard Commands to UI Actions

**User Story:** As a user, I want to copy prompts to my system clipboard and paste them into other applications, so that I can use my prompts outside of PromptDock.

#### Acceptance Criteria

1. WHEN a user selects "Copy" on a prompt without variables, THE AppShell SHALL invoke the Tauri copy_to_clipboard command with the prompt body text.
2. WHEN a user completes variable filling and clicks "Copy" in the VariableFillModal, THE AppShell SHALL invoke the Tauri copy_to_clipboard command with the rendered text.
3. WHEN a user completes variable filling and clicks "Paste" in the VariableFillModal, THE AppShell SHALL invoke the Tauri copy_to_clipboard command followed by the paste_to_active_app command.
4. IF the Tauri copy_to_clipboard command fails, THEN THE AppShell SHALL fall back to the browser navigator.clipboard.writeText API.
5. WHEN a user selects a prompt via the CommandPalette, THE AppShell SHALL invoke the Tauri copy_to_clipboard command instead of using navigator.clipboard directly.

### Requirement 4: Wire Global Hotkey Registration to Settings

**User Story:** As a user, I want to change my global hotkey and have it take effect immediately, so that I can customize how I access PromptDock.

#### Acceptance Criteria

1. WHEN the application starts, THE App SHALL invoke the Tauri register_hotkey command with the hotkey combination stored in the SettingsStore.
2. WHEN a user changes the hotkey in the SettingsScreen, THE SettingsScreen SHALL invoke the Tauri register_hotkey command with the new combination.
3. IF the Tauri register_hotkey command fails, THEN THE SettingsScreen SHALL display an error message indicating the hotkey could not be registered.
4. WHEN the hotkey is pressed system-wide, THE Tauri_Command SHALL toggle the QuickLauncherWindow visibility.

### Requirement 5: Wire Authentication Flow in SettingsScreen

**User Story:** As a user, I want to sign in with my email and password from the settings screen, so that I can enable cloud sync for my prompts.

#### Acceptance Criteria

1. WHEN a user submits the sign-in form in the SettingsScreen, THE SettingsScreen SHALL call AuthService.signIn with the provided email and password.
2. WHEN AuthService.signIn returns a successful result, THE SettingsScreen SHALL update the AppModeStore with the user ID and set the mode to synced.
3. WHEN a user submits the sign-up form in the SettingsScreen, THE SettingsScreen SHALL call AuthService.signUp with the provided email and password.
4. IF AuthService.signIn returns an error, THEN THE SettingsScreen SHALL display the corresponding error message (invalid credentials, email in use, weak password).
5. WHEN a user clicks "Sign Out", THE SettingsScreen SHALL call AuthService.signOut and transition the AppModeStore back to local mode.
6. WHEN the application starts, THE App SHALL call AuthService.restoreSession to check for an existing authenticated session.
7. IF AuthService.restoreSession returns a valid user, THEN THE App SHALL update the AppModeStore with the user ID and set the mode to synced.

### Requirement 6: Wire Onboarding Screen to Mode Transitions

**User Story:** As a first-time user, I want my onboarding choice to configure the application mode, so that the app starts in the correct state.

#### Acceptance Criteria

1. WHEN a user selects "Start locally" on the OnboardingScreen, THE OnboardingScreen SHALL set the AppModeStore mode to local and navigate to the library screen.
2. WHEN a user selects "Sign in" on the OnboardingScreen, THE OnboardingScreen SHALL present a sign-in form and call AuthService.signIn upon submission.
3. WHEN a user selects "Enable sync" on the OnboardingScreen, THE OnboardingScreen SHALL initiate the SyncService.transitionToSynced flow with a guest workspace.
4. WHEN onboarding completes successfully, THE App SHALL persist the onboarding-complete flag so the OnboardingScreen does not appear on subsequent launches.

### Requirement 7: Wire SyncService to PromptStore

**User Story:** As a signed-in user, I want my prompts to sync in real time with Firestore, so that changes appear across all my devices.

#### Acceptance Criteria

1. WHEN the AppModeStore transitions to synced mode, THE App SHALL instantiate the SyncService with the AppModeStore and PromptStore callbacks.
2. WHEN the SyncService receives remote prompt changes via onSnapshot, THE SyncService SHALL update the PromptStore with the new prompt list.
3. WHEN a user creates, updates, or deletes a prompt in synced mode, THE PromptRepository SHALL delegate the operation to the FirestoreBackend.
4. WHEN the application goes offline while in synced mode, THE SyncService SHALL transition the AppModeStore to offline-synced mode.
5. WHEN the application reconnects while in offline-synced mode, THE SyncService SHALL transition the AppModeStore back to synced mode and resume sync.

### Requirement 8: Wire Conflict Resolution UI

**User Story:** As a synced user, I want to see and resolve conflicts when the same prompt is edited on multiple devices, so that I do not lose any changes.

#### Acceptance Criteria

1. WHEN the SyncService detects a conflict between local and remote versions, THE SyncService SHALL call ConflictService.processConflict to register the conflict.
2. WHEN unresolved conflicts exist, THE AppShell SHALL display a conflict badge with the count of unresolved conflicts.
3. WHEN a user clicks the conflict badge, THE AppShell SHALL navigate to the ConflictCenter screen.
4. WHEN a user resolves a conflict by choosing "Keep Local", THE ConflictCenter SHALL call ConflictService.resolveKeepLocal and update the PromptStore with the local version.
5. WHEN a user resolves a conflict by choosing "Keep Remote", THE ConflictCenter SHALL call ConflictService.resolveKeepRemote and update the PromptStore with the remote version.

### Requirement 9: Wire Import/Export to UI

**User Story:** As a user, I want to export my prompt library to a JSON file and import prompts from a JSON file, so that I can back up and transfer my data.

#### Acceptance Criteria

1. WHEN a user clicks "Export" in the SettingsScreen, THE SettingsScreen SHALL call ImportExportService.exportToJSON with the current prompts from the PromptStore.
2. WHEN the export JSON is generated, THE SettingsScreen SHALL trigger a file download using the Tauri file dialog or browser download mechanism.
3. WHEN a user clicks "Import" in the SettingsScreen, THE SettingsScreen SHALL open a file picker dialog for JSON files.
4. WHEN a valid JSON file is selected, THE SettingsScreen SHALL call ImportExportService.importFromJSON and add the imported prompts to the PromptStore.
5. IF ImportExportService.importFromJSON returns validation errors, THEN THE SettingsScreen SHALL display the error messages to the user.
6. WHEN imported prompts have duplicates with existing prompts, THE SettingsScreen SHALL call ImportExportService.detectDuplicates and present the user with options to skip or overwrite.

### Requirement 10: Consolidate Duplicate Library Screen Implementations

**User Story:** As a developer, I want a single library screen implementation, so that the codebase is maintainable and behavior is consistent.

#### Acceptance Criteria

1. THE AppShell SHALL use a single library screen component that reads from the PromptStore.
2. THE AppShell SHALL remove the duplicate LibraryScreen component that relies on props passed from the AppShell reducer.
3. WHEN the consolidated library screen renders, THE Library_Screen SHALL display prompts from the PromptStore with search, folder filtering, and favorite filtering.
4. THE consolidated Library_Screen SHALL support all existing interactions: select prompt, toggle favorite, change filter, create new prompt.

### Requirement 11: Wire Theme Application

**User Story:** As a user, I want my theme preference to apply to the application UI, so that I can use PromptDock in light mode, dark mode, or follow my system preference.

#### Acceptance Criteria

1. WHEN the SettingsStore theme value is "dark", THE App SHALL apply the dark theme CSS class to the root HTML element.
2. WHEN the SettingsStore theme value is "light", THE App SHALL apply the light theme CSS class to the root HTML element.
3. WHEN the SettingsStore theme value is "system", THE App SHALL use the operating system's preferred color scheme via the prefers-color-scheme media query.
4. WHEN a user changes the theme in the SettingsScreen, THE App SHALL apply the new theme within 100 milliseconds without requiring a page reload.

### Requirement 12: Wire QuickLauncherWindow to PromptStore

**User Story:** As a user, I want the quick launcher to search and display my real prompts, so that I can quickly find and use prompts from any application.

#### Acceptance Criteria

1. WHEN the QuickLauncherWindow opens, THE QuickLauncherWindow SHALL read prompts from the PromptStore.
2. WHEN a user types a search query in the QuickLauncherWindow, THE QuickLauncherWindow SHALL filter prompts using the SearchEngine service.
3. WHEN a user selects a prompt in the QuickLauncherWindow, THE QuickLauncherWindow SHALL invoke the Tauri copy_to_clipboard command with the prompt body.
4. WHEN a prompt has variables and is selected in the QuickLauncherWindow, THE QuickLauncherWindow SHALL open the VariableFillModal for variable entry before copying.
5. WHEN the copy or paste action completes in the QuickLauncherWindow, THE QuickLauncherWindow SHALL hide itself automatically.

### Requirement 13: Add Error Boundaries

**User Story:** As a user, I want the application to handle errors gracefully, so that a failure in one component does not crash the entire application.

#### Acceptance Criteria

1. THE App SHALL wrap the AppShell in a React error boundary component.
2. IF a rendering error occurs within the AppShell, THEN THE Error_Boundary SHALL display a user-friendly error message with a "Reload" button.
3. IF a PromptStore action (create, update, delete) fails, THEN THE AppShell SHALL display a toast notification with the error message.
4. IF a SettingsStore action fails, THEN THE SettingsScreen SHALL display an inline error message near the affected setting.

### Requirement 14: Add Loading States

**User Story:** As a user, I want to see loading indicators while data is being fetched, so that I know the application is working.

#### Acceptance Criteria

1. WHILE the App is initializing stores and loading data, THE App SHALL display a loading screen with a spinner and "Loading PromptDock…" text.
2. WHILE the PromptStore is loading prompts from the repository, THE Library_Screen SHALL display a skeleton loading state instead of an empty grid.
3. WHILE the SettingsStore is loading settings from the repository, THE SettingsScreen SHALL display placeholder content for each settings section.
4. WHILE the SyncService is transitioning between modes, THE SyncStatusBar SHALL display a "Syncing…" indicator.

### Requirement 15: Wire Sidebar Counts to Real Data

**User Story:** As a user, I want the sidebar to show accurate counts for my prompts, favorites, and folders, so that I can understand my library at a glance.

#### Acceptance Criteria

1. THE Sidebar SHALL read the total non-archived prompt count from the PromptStore.
2. THE Sidebar SHALL read the favorite prompt count from the PromptStore by counting prompts where favorite is true.
3. THE Sidebar SHALL read the recent prompt count from the PromptStore by counting prompts with a non-null lastUsedAt within the last 7 days.
4. THE Sidebar SHALL read the archived prompt count from the PromptStore by counting prompts where archived is true.
5. THE Sidebar SHALL compute folder prompt counts from the PromptStore by grouping non-archived prompts by folderId.
6. THE Sidebar SHALL remove all hardcoded mock tags and mock workspace data.

### Requirement 16: Wire Folder and Tag Management

**User Story:** As a user, I want to create, rename, and delete folders and tags, so that I can organize my prompt library.

#### Acceptance Criteria

1. WHEN a user clicks the "+" button in the Folders section of the Sidebar, THE Sidebar SHALL present an inline input for entering a new folder name.
2. WHEN a user submits a new folder name, THE Sidebar SHALL persist the folder through the LocalStorageBackend and update the Sidebar folder list.
3. WHEN a user adds a tag to a prompt in the PromptEditor, THE PromptEditor SHALL include the tag in the prompt update persisted through the PromptStore.
4. THE Sidebar SHALL compute tag counts dynamically from the PromptStore by aggregating tags across all non-archived prompts.
