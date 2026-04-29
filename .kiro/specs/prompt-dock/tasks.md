# Implementation Plan: PromptDock

## Overview

This plan implements PromptDock as a local-first desktop prompt recipe manager using Tauri 2 (Rust) + React + TypeScript + Vite + Tailwind CSS. Tasks are ordered so each step builds on the previous: project scaffold → types → local storage → core services → repository layer → UI screens → Tauri native commands → optional Firebase/sync layer → testing → polish. Property-based tests use fast-check and are placed close to the code they validate.

## Tasks

- [x] 1. Project scaffold and configuration
  - [x] 1.1 Initialize Tauri 2 + React + TypeScript + Vite project
    - Create the project using `create-tauri-app` or equivalent scaffold
    - Configure `package.json` with dependencies: react, react-dom, zustand, tailwindcss, vitest, fast-check, @tauri-apps/api, @tauri-apps/plugin-global-shortcut, @tauri-apps/plugin-clipboard-manager, @tauri-apps/plugin-store
    - Configure `vite.config.ts` for Tauri 2
    - Configure `tailwind.config.js` and add Tailwind directives to the main CSS file
    - Configure `tsconfig.json` with strict mode
    - Set up Vitest in `vitest.config.ts`
    - Create `.env.example` with `VITE_USE_EMULATOR`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_EMULATOR_AUTH_HOST`, `VITE_EMULATOR_FIRESTORE_HOST`
    - _Requirements: 28.1, 28.6_

  - [x] 1.2 Configure Tauri 2 Rust project
    - Set up `src-tauri/Cargo.toml` with dependencies: tauri 2, tauri-plugin-global-shortcut, tauri-plugin-clipboard-manager, tauri-plugin-store, enigo, serde, serde_json
    - Configure `tauri.conf.json` with app name, window definitions (main window + quick launcher window), and plugin permissions
    - Create initial `src-tauri/src/main.rs` with Tauri builder and plugin registrations
    - _Requirements: 28.4_

- [x] 2. TypeScript type definitions and data models
  - [x] 2.1 Define core TypeScript interfaces and types
    - Create `src/types/index.ts` with interfaces: `PromptRecipe`, `PromptVariable`, `Workspace`, `WorkspaceMember`, `UserSettings`, `PromptConflict`
    - Define `AppMode` type (`'local' | 'synced' | 'offline-synced'`), `SyncStatus` type, `RenderResult` type, `ImportResult` type, `DuplicateInfo` interface, `AuthResult` type, `AuthError` type, `AuthUser` interface
    - Define `AppModeState` interface
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

  - [x] 2.2 Define repository interfaces
    - Create `src/repositories/interfaces.ts` with `IPromptRepository`, `IWorkspaceRepository`, `ISettingsRepository`
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 2.3 Define service interfaces
    - Create `src/services/interfaces.ts` with `IVariableParser`, `IPromptRenderer`, `ISearchEngine`, `IImportExportService`, `IAuthService`
    - _Requirements: 12.1, 13.1, 14.1, 19.1, 2.1_

- [x] 3. Local storage backend
  - [x] 3.1 Implement LocalStorageBackend
    - Create `src/repositories/local-storage-backend.ts`
    - Implement read/write operations using `@tauri-apps/plugin-store` for `prompts.json`, `folders.json`, `settings.json`, `workspace.json`
    - Implement atomic write with immediate disk persistence on every mutation
    - Implement load-on-startup for all persisted data
    - Handle corrupted file recovery: log error, preserve as `.backup`, initialize with empty collection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 1.2_

  - [x] 3.2 Write property test for Local Storage round-trip
    - **Property 1: Local Storage Round-Trip**
    - Generate arbitrary valid `PromptRecipe` objects, write to LocalStorageBackend, read back, assert deep equality
    - **Validates: Requirements 6.5, 1.2**

  - [x] 3.3 Write unit tests for LocalStorageBackend
    - Test write/read round-trip with concrete examples
    - Test load on startup
    - Test corrupted file handling
    - _Requirements: 26.5_

- [x] 4. Core services — Variable Parser and Prompt Renderer
  - [x] 4.1 Implement VariableParser
    - Create `src/services/variable-parser.ts`
    - Implement regex-based extraction of `{{variable_name}}` placeholders
    - Return unique variable names in first-appearance order
    - Treat variable names as case-sensitive
    - Return empty array for templates with no variables
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 4.2 Write property tests for VariableParser
    - **Property 4: Variable Parser Extracts Unique Variables in First-Appearance Order**
    - **Property 5: Variable Parser Case Sensitivity**
    - **Property 6: Variable Parser Round-Trip**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.6**

  - [x] 4.3 Write unit tests for VariableParser
    - Test single variable, multiple variables, duplicate deduplication, no variables, malformed placeholders, case-sensitive names
    - _Requirements: 26.1_

  - [x] 4.4 Implement PromptRenderer
    - Create `src/services/prompt-renderer.ts`
    - Substitute all `{{variable_name}}` occurrences with provided values
    - Return `RenderResult` with `success: true` and rendered text when all variables provided
    - Return `RenderResult` with `success: false` and `missingVariables` list when values are incomplete
    - Return template unchanged when no variables present
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 4.5 Write property tests for PromptRenderer
    - **Property 7: Prompt Rendering No-Placeholder**
    - **Property 8: Prompt Rendering Identity for Variable-Free Templates**
    - **Property 9: Prompt Rendering Missing Variable Error**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**

  - [x] 4.6 Write unit tests for PromptRenderer
    - Test single substitution, multiple substitution, missing variable error, no-variable passthrough, multi-occurrence replacement
    - _Requirements: 26.2_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Core services — Search Engine and Import/Export
  - [x] 6.1 Implement SearchEngine
    - Create `src/services/search-engine.ts`
    - Implement local in-memory search over loaded `PromptRecipe[]`
    - Rank results by field priority: title (highest) → tags → description → body (lowest)
    - Perform case-insensitive matching
    - Exclude archived prompts from results
    - Return all non-archived prompts when query is empty
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 6.2 Write property tests for SearchEngine
    - **Property 10: Search Excludes Archived Prompts**
    - **Property 11: Search Case Insensitivity**
    - **Property 12: Search Recall for Exact Title Match**
    - **Property 13: Search Ranking by Field Priority**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5, 14.6**

  - [x] 6.3 Write unit tests for SearchEngine
    - Test title match ranking, tag match ranking, case-insensitive matching, archived exclusion, empty query returns all
    - _Requirements: 26.3_

  - [x] 6.4 Implement ImportExportService
    - Create `src/services/import-export.ts`
    - Implement `exportToJSON`: serialize non-archived prompts to JSON with schema version `"1.0"`, `exportedAt` timestamp, and `prompts` array
    - Implement `importFromJSON`: parse JSON, validate against export schema, return `ImportResult`
    - Implement `detectDuplicates`: compare incoming prompts against existing by title and body
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 6.5 Write property tests for ImportExportService
    - **Property 17: Import/Export Round-Trip**
    - **Property 18: Export Produces Valid Schema JSON**
    - **Property 19: Export Contains All Non-Archived Prompts**
    - **Property 20: Import Schema Validation Rejects Invalid JSON**
    - **Property 21: Import Duplicate Detection**
    - **Validates: Requirements 19.1, 19.2, 19.4, 19.5, 19.6**

  - [x] 6.6 Write unit tests for ImportExportService
    - Test valid export, valid import, schema validation failure, duplicate detection
    - _Requirements: 26.4_

- [x] 7. Repository layer
  - [x] 7.1 Implement PromptRepository with LocalStorageBackend delegation
    - Create `src/repositories/prompt-repository.ts`
    - Implement `IPromptRepository` methods: `create`, `getById`, `getAll`, `update`, `softDelete`, `restore`, `duplicate`, `toggleFavorite`
    - `create`: generate UUID, set `createdAt`/`updatedAt`, `createdBy` to `'local'`, `version` to 1
    - `update`: set `updatedAt` to current timestamp, increment `version`
    - `softDelete`: set `archived: true`, `archivedAt` to current timestamp
    - `restore`: set `archived: false`, `archivedAt` to null
    - `duplicate`: create new recipe with `"Copy of " + title` and new `id`
    - `toggleFavorite`: flip `favorite` boolean
    - Delegate to `LocalStorageBackend` in Local Mode
    - _Requirements: 7.1, 7.3, 7.6, 11.1, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 7.2 Write property tests for PromptRepository
    - **Property 3: Archive/Restore Round-Trip**
    - **Property 14: Update Sets updatedAt Timestamp**
    - **Property 15: Duplicate Prefixes Title**
    - **Property 16: Favorite Toggle Flips Boolean**
    - **Validates: Requirements 7.6, 11.3, 11.4, 11.5, 11.6, 11.7**

  - [x] 7.3 Write unit tests for PromptRepository
    - Test create, update (updatedAt), duplicate (title prefix), favorite toggle, archive/restore
    - _Requirements: 26.5_

  - [x] 7.4 Implement WorkspaceRepository
    - Create `src/repositories/workspace-repository.ts`
    - Implement `IWorkspaceRepository` methods: `create`, `getById`, `listForUser`, `update`
    - In Local Mode, manage a single default workspace
    - _Requirements: 7.4_

  - [x] 7.5 Implement SettingsRepository
    - Create `src/repositories/settings-repository.ts`
    - Implement `ISettingsRepository` methods: `get`, `update`
    - Default settings: `hotkeyCombo: 'CommandOrControl+Shift+P'`, `theme: 'system'`, `defaultAction: 'copy'`, `activeWorkspaceId: 'local'`
    - _Requirements: 7.5, 20.4, 20.5, 20.6_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. State management with Zustand
  - [x] 9.1 Implement PromptStore
    - Create `src/stores/prompt-store.ts`
    - Implement `PromptStore` slice with state: `prompts`, `activeWorkspaceId`, `selectedPromptId`, `searchQuery`, `folderFilter`, `favoriteFilter`
    - Implement actions: `loadPrompts`, `createPrompt`, `updatePrompt`, `deletePrompt`, `duplicatePrompt`, `toggleFavorite`, `archivePrompt`, `restorePrompt`, `setSearchQuery`, `setFolderFilter`, `setFavoriteFilter`
    - Wire actions to `PromptRepository`
    - _Requirements: 11.1, 11.3, 11.4, 11.5, 11.6, 11.7, 14.1_

  - [x] 9.2 Implement AppModeStore
    - Create `src/stores/app-mode-store.ts`
    - Implement `AppModeStore` slice with state: `mode`, `userId`, `isOnline`, `syncStatus`, `lastSyncedAt`
    - Default to `mode: 'local'`, `userId: null`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.3 Implement SettingsStore
    - Create `src/stores/settings-store.ts`
    - Implement `SettingsStore` slice with state: `settings`
    - Implement actions: `loadSettings`, `updateSettings`
    - Wire to `SettingsRepository`
    - _Requirements: 20.4, 20.5, 20.6_

- [x] 10. Seed data
  - [x] 10.1 Create seed data service
    - Create `src/services/seed-data.ts`
    - Define sample Prompt_Recipes: "Summarize Text", "Rewrite in Clear English", "Generate Product Ideas", "Code Review Assistant", "Email Draft", "Meeting Notes Extractor"
    - Each recipe includes realistic template bodies with `{{variable_name}}` placeholders
    - On first launch, populate the default local workspace with seed data
    - _Requirements: 24.1, 24.2, 1.1_

- [x] 11. UI — Main Library Screen
  - [x] 11.1 Implement AppModeProvider context
    - Create `src/contexts/AppModeProvider.tsx`
    - Provide `mode`, `userId`, `isOnline` to the component tree
    - _Requirements: 5.1, 5.2_

  - [x] 11.2 Implement MainLibraryScreen
    - Create `src/screens/MainLibraryScreen.tsx`
    - Display list of PromptRecipes with title, description preview, tags, favorite indicator, last-used timestamp
    - Implement folder sidebar for filtering by folder
    - Implement favorite filter toggle
    - Display as default view on launch (no auth screen)
    - _Requirements: 21.2, 21.3, 21.4, 1.5_

  - [x] 11.3 Implement SearchBar component
    - Create `src/components/SearchBar.tsx`
    - Wire to `PromptStore.setSearchQuery` and `SearchEngine`
    - Filter results as user types
    - _Requirements: 14.1_

  - [x] 11.4 Implement SyncStatusBar component
    - Create `src/components/SyncStatusBar.tsx`
    - Display current sync status: "Local", "Synced", "Syncing", "Offline"
    - Show sign-in prompt in Local Mode
    - Show last synced timestamp in Synced Mode
    - Show pending changes count when offline
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 11.5 Implement PromptCard component
    - Create `src/components/PromptCard.tsx`
    - Display title, description, tags, favorite indicator, last-used timestamp
    - Provide actions: edit, duplicate, favorite, archive, copy, paste
    - _Requirements: 21.3, 11.4, 11.5, 11.6, 16.1_

- [x] 12. UI — Prompt Editor
  - [x] 12.1 Implement PromptEditor screen
    - Create `src/screens/PromptEditor.tsx`
    - Include TitleInput, DescriptionInput, BodyEditor (with variable highlighting), TagInput, FolderSelect
    - Populate fields when editing an existing recipe
    - On save, call `PromptStore.createPrompt` or `PromptStore.updatePrompt`
    - Highlight `{{variable_name}}` placeholders in the body editor
    - _Requirements: 11.1, 11.2, 11.3, 21.1_

- [x] 13. UI — Variable Fill Modal
  - [x] 13.1 Implement VariableFillModal
    - Create `src/components/VariableFillModal.tsx`
    - Use `VariableParser` to extract variables from the selected prompt
    - Display a labeled input field for each detected variable
    - Show rendered preview using `PromptRenderer`
    - Provide action buttons: Copy, Paste into Active App, Copy & Close
    - _Requirements: 21.5, 21.6, 13.1, 13.2, 16.1, 16.2, 16.3_

- [x] 14. UI — Settings Screen
  - [x] 14.1 Implement SettingsScreen
    - Create `src/screens/SettingsScreen.tsx`
    - AccountSection: show email/display name when signed in, or sign-in/sign-up forms when in Local Mode
    - HotkeyConfig: allow configuring the global hotkey combination
    - ThemeSelector: light, dark, system
    - DefaultActionSelector: copy or paste
    - ImportExportSection: buttons for import and export
    - SyncStatusSection: display sync status and last synced timestamp
    - WorkspaceSwitcher: visible only in Synced Mode
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 21.7_

- [x] 15. Checkpoint — Ensure all tests pass and UI renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Tauri Rust commands
  - [x] 16.1 Implement clipboard and paste commands
    - Create `src-tauri/src/commands.rs` (or extend existing)
    - Implement `copy_to_clipboard` using `tauri-plugin-clipboard-manager`
    - Implement `paste_to_active_app` using `enigo` crate for OS-level Cmd+V / Ctrl+V simulation
    - _Requirements: 16.1, 16.4, 16.5_

  - [x] 16.2 Implement hotkey registration commands
    - Implement `register_hotkey` and `unregister_hotkey` using `tauri-plugin-global-shortcut`
    - Register default hotkey on app startup
    - _Requirements: 15.1, 15.5_

  - [x] 16.3 Implement window management commands
    - Implement `toggle_quick_launcher`, `show_main_window`, `hide_main_window`
    - Configure quick launcher as a separate Tauri window (borderless, always-on-top, centered)
    - _Requirements: 22.2, 22.3_

- [x] 17. Tray icon and window management
  - [x] 17.1 Implement system tray
    - Configure tray icon in Tauri setup
    - Implement tray click to toggle main window visibility
    - Implement "Quit" context menu item
    - Minimize to tray on window close instead of quitting
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [x] 18. UI — Quick Launcher window
  - [x] 18.1 Implement QuickLauncherWindow
    - Create `src/screens/QuickLauncherWindow.tsx`
    - Auto-focus search input on open
    - Wire search to `SearchEngine` for instant results
    - On prompt selection: show VariableFillModal if variables exist, otherwise copy body to clipboard
    - Close on Escape key
    - Wire to Rust commands for clipboard/paste operations
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 16.1, 16.2, 16.3, 16.4_

- [x] 19. Checkpoint — Ensure all tests pass and native features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Firebase setup and lazy initialization
  - [x] 20.1 Create Firebase configuration module
    - Create `src/firebase/config.ts`
    - Implement lazy initialization: Firebase SDK is NOT imported or initialized until user opts into sync
    - Read config from environment variables
    - Support emulator connection when `VITE_USE_EMULATOR=true`
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 1.4_

  - [x] 20.2 Implement AuthService
    - Create `src/services/auth-service.ts`
    - Implement `IAuthService`: `signUp`, `signIn`, `signOut`, `restoreSession`, `sendPasswordReset`, `onAuthStateChanged`
    - On sign-in: transition app from Local Mode to Synced Mode
    - On sign-out: transition back to Local Mode, restore local workspace
    - On sign-up: create user document in Firestore `users` collection
    - Handle errors: invalid credentials, email in use, weak password, network unavailable
    - Session restore on launch: silently fall back to Local Mode on failure
    - _Requirements: 2.1, 2.2, 2.6, 3.1, 3.2, 3.3, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.6_

  - [x] 20.3 Implement FirestoreBackend
    - Create `src/repositories/firestore-backend.ts`
    - Implement `IPromptRepository` against Firestore collections: `workspaces/{workspaceId}/prompts/{promptId}`
    - Implement Firestore data converter functions for `PromptRecipe`, `Workspace`, `UserSettings`
    - Enable Firestore persistent local cache for offline support
    - _Requirements: 7.2, 7.7, 8.1, 8.2, 8.3_

  - [x] 20.4 Write property test for Firestore converter round-trip
    - **Property 2: Firestore Converter Round-Trip**
    - Generate arbitrary valid `PromptRecipe` objects, convert to Firestore doc and back, assert deep equality
    - **Validates: Requirements 7.8**

  - [x] 20.5 Write unit tests for Firestore converters
    - Test round-trip conversion of PromptRecipe, Workspace, UserSettings
    - _Requirements: 26.6_

- [x] 21. Sync and conflict resolution
  - [x] 21.1 Implement SyncService
    - Create `src/services/sync-service.ts`
    - Wire `PromptRepository` to delegate to `FirestoreBackend` in Synced Mode
    - Implement real-time sync using Firestore `onSnapshot` listeners
    - Handle mode transitions: Local → Synced (with migration offer), Synced → Offline, Offline → Synced
    - _Requirements: 5.3, 5.4, 5.5, 2.3, 2.4_

  - [x] 21.2 Implement conflict detection and ConflictCenter UI
    - Create `src/services/conflict-service.ts` for conflict detection logic
    - Create `src/screens/ConflictCenter.tsx` with side-by-side diff view
    - Detect conflicts when a prompt is modified both locally and remotely
    - Create `PromptConflict` documents for unresolved conflicts
    - Display conflict badge in Main Library Screen
    - Implement "Keep Local" and "Keep Remote" resolution actions
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 22. Firestore security rules and indexes
  - [x] 22.1 Write Firestore security rules
    - Create `firestore.rules`
    - Users can read/write only their own user document
    - Workspace members can read workspace documents they belong to
    - Only owner/editor roles can create, update, soft-delete prompts
    - Only owner role can delete workspace or modify member roles
    - Deny all access to unauthenticated requests
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 22.2 Write Firestore composite indexes
    - Create `firestore.indexes.json`
    - Index: prompts by `workspaceId` + `archived` + `updatedAt`
    - Index: prompts by `workspaceId` + `archived` + `lastUsedAt`
    - Index: prompts by `workspaceId` + `archived` + `createdAt`
    - Index: prompts by `workspaceId` + `archived` + `favorite`
    - Index: prompts by `workspaceId` + `archived` + `tags` (array)
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 23. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Firebase Emulator configuration
  - [x] 24.1 Set up Firebase Emulator Suite
    - Create `firebase.json` with emulator configuration for Auth and Firestore
    - Document emulator startup commands in README
    - Verify `VITE_USE_EMULATOR=true` connects to local emulators
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 8.4_

- [x] 25. Security and privacy hardening
  - [x] 25.1 Implement security and privacy requirements
    - Verify no telemetry or analytics collection exists in the codebase
    - Verify clipboard history is not stored beyond current copy operation
    - Verify no admin credentials are embedded in client code
    - Verify soft deletes are used for all prompt deletion operations
    - Verify Local Mode stores all data exclusively on local file system with no network transmission
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6_

- [x] 26. README and documentation
  - [x] 26.1 Create README with setup and development instructions
    - Create `README.md`
    - Include: project overview, prerequisites, installation steps, development commands, environment variable setup, Firebase Emulator usage, build instructions, project structure overview
    - _Requirements: 28.5_

- [x] 27. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the build
- Property tests validate the 21 universal correctness properties defined in the design document using fast-check
- Unit tests validate specific examples and edge cases
- Firebase/sync features (tasks 20–24) are isolated so the local-first experience can be built and validated independently
- The Quick Launcher window is a separate Tauri window, not a route in the main window
