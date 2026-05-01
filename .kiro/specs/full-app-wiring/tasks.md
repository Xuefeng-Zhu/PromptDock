# Tasks

## Task 1: Replace Mock Data with PromptStore in AppShell

- [x] 1.1 Remove useReducer, appReducer, AppState, AppAction, and MOCK_PROMPTS/MOCK_FOLDERS imports from AppShell.tsx
- [x] 1.2 Add usePromptStore() selectors for prompts, folders, searchQuery, folderFilter, and favoriteFilter in AppShell
- [x] 1.3 Replace dispatch({ type: 'TOGGLE_FAVORITE' }) with PromptStore.toggleFavorite() call
- [x] 1.4 Replace dispatch({ type: 'SAVE_PROMPT' }) with PromptStore.updatePrompt() call
- [x] 1.5 Replace dispatch({ type: 'CREATE_PROMPT' }) with PromptStore.createPrompt() call
- [x] 1.6 Add PromptStore.archivePrompt() and PromptStore.duplicatePrompt() wiring in AppShell callbacks
- [x] 1.7 Keep navigation state (screen, selectedPromptId, commandPaletteOpen, variableFillPromptId) as local useState
- [x] 1.8 Write integration tests verifying AppShell delegates CRUD operations to PromptStore

## Task 2: Wire SettingsScreen to SettingsStore

- [x] 2.1 Remove all local useState mock state (syncState, theme, density, hotkey, defaultAction) from SettingsScreen
- [x] 2.2 Add useSettingsStore() selectors to read current settings values in SettingsScreen
- [x] 2.3 Wire theme change handler to call SettingsStore.updateSettings({ theme })
- [x] 2.4 Wire hotkey change handler to call SettingsStore.updateSettings({ hotkeyCombo })
- [x] 2.5 Wire default action change handler to call SettingsStore.updateSettings({ defaultAction })
- [x] 2.6 Write integration tests verifying SettingsScreen reads from and writes to SettingsStore

## Task 3: Wire Tauri Clipboard Commands to UI Actions

- [x] 3.1 Create src/utils/clipboard.ts with copyToClipboard() and pasteToActiveApp() utility functions that wrap Tauri invoke with browser fallback
- [x] 3.2 Replace navigator.clipboard.writeText calls in AppShell with copyToClipboard() utility
- [x] 3.3 Wire VariableFillModal onCopy callback to use copyToClipboard() utility
- [x] 3.4 Wire VariableFillModal onPaste callback to use pasteToActiveApp() utility
- [x] 3.5 Wire CommandPalette onSelectPrompt to use copyToClipboard() utility
- [ ] 3.6 Write property-based test for clipboard fallback (Property 1)
  - [x] 3.6.pbt Verify: for any non-empty string, when Tauri invoke fails, navigator.clipboard.writeText is called with the exact same string

## Task 4: Wire Global Hotkey Registration to Settings

- [x] 4.1 Create src/utils/hotkey.ts with registerHotkey() utility function wrapping Tauri invoke
- [x] 4.2 Call registerHotkey() during app initialization in App.tsx with hotkey from SettingsStore
- [x] 4.3 Wire SettingsScreen hotkey change to call registerHotkey() after updating SettingsStore
- [x] 4.4 Add error handling in SettingsScreen to display error message if registerHotkey() fails
- [x] 4.5 Write tests for hotkey registration and error display

## Task 5: Wire Authentication Flow in SettingsScreen

- [x] 5.1 Add sign-in form UI to SettingsScreen AccountCard with email/password fields
- [x] 5.2 Wire sign-in form submission to call AuthService.signIn() and update AppModeStore on success
- [x] 5.3 Wire sign-up form submission to call AuthService.signUp() and update AppModeStore on success
- [x] 5.4 Display auth error messages (invalid-credentials, email-in-use, weak-password) in the form
- [x] 5.5 Wire "Sign Out" button to call AuthService.signOut() and transition AppModeStore to local mode
- [x] 5.6 Add AuthService.restoreSession() call during app initialization in App.tsx
- [x] 5.7 Update AppModeStore with user ID and synced mode when restoreSession returns a valid user
- [x] 5.8 Write integration tests for sign-in, sign-up, sign-out, and session restore flows

## Task 6: Wire Onboarding Screen to Mode Transitions

- [x] 6.1 Wire "Start locally" button to set AppModeStore mode to local and navigate to library
- [x] 6.2 Wire "Sign in" button to present sign-in form and call AuthService.signIn on submission
- [x] 6.3 Wire "Enable sync" button to initiate SyncService.transitionToSynced with guest workspace
- [x] 6.4 Persist onboarding-complete flag after successful onboarding completion
- [x] 6.5 Check onboarding-complete flag on app start to skip OnboardingScreen on subsequent launches
- [x] 6.6 Write integration tests for each onboarding path and flag persistence

## Task 7: Wire SyncService to PromptStore

- [x] 7.1 Instantiate SyncService during app initialization when AppModeStore transitions to synced mode
- [x] 7.2 Wire SyncService onRemotePromptsChanged callback to update PromptStore with new prompt list
- [x] 7.3 Wire SyncService onConflictDetected callback to ConflictService.processConflict
- [x] 7.4 Configure PromptRepository to delegate to FirestoreBackend when in synced mode
- [x] 7.5 Wire online/offline events to SyncService for mode transitions (synced ↔ offline-synced)
- [x] 7.6 Write integration tests for sync mode transitions and remote update handling

## Task 8: Wire Conflict Resolution UI

- [x] 8.1 Add ConflictService instance to app initialization and make it accessible to AppShell
- [x] 8.2 Display ConflictBadge in AppShell header when ConflictService has unresolved conflicts
- [x] 8.3 Add ConflictCenter as a navigable screen in AppShell
- [x] 8.4 Wire "Keep Local" resolution to call ConflictService.resolveKeepLocal and update PromptStore
- [x] 8.5 Wire "Keep Remote" resolution to call ConflictService.resolveKeepRemote and update PromptStore
- [x] 8.6 Write integration tests for conflict badge display and resolution flows

## Task 9: Wire Import/Export to UI

- [x] 9.1 Wire SettingsScreen "Export" button to call ImportExportService.exportToJSON with prompts from PromptStore
- [x] 9.2 Implement file download using Tauri file dialog (save dialog) with browser download fallback
- [x] 9.3 Wire SettingsScreen "Import" button to open file picker dialog for JSON files
- [x] 9.4 Wire selected file to ImportExportService.importFromJSON and add valid prompts to PromptStore
- [x] 9.5 Display validation error messages when importFromJSON returns errors
- [x] 9.6 Wire ImportExportService.detectDuplicates to present skip/overwrite options for duplicate prompts
- [x] 9.7 Write integration tests for export, import, error display, and duplicate handling

## Task 10: Consolidate Duplicate Library Screen Implementations

- [x] 10.1 Refactor AppShell to use a single library screen component that reads from PromptStore
- [x] 10.2 Remove or merge the duplicate LibraryScreen component (src/components/LibraryScreen.tsx) with MainLibraryScreen (src/screens/MainLibraryScreen.tsx)
- [x] 10.3 Ensure consolidated library screen supports search, folder filtering, favorite filtering, and all interactions
- [x] 10.4 Update imports and references across the codebase
- [x] 10.5 Write tests verifying the consolidated library screen renders correctly with PromptStore data

## Task 11: Wire Theme Application

- [x] 11.1 Create src/utils/theme.ts with applyTheme() utility function that sets CSS classes on document.documentElement
- [x] 11.2 Add useEffect in App.tsx that calls applyTheme() whenever SettingsStore theme value changes
- [x] 11.3 Handle "system" theme by listening to prefers-color-scheme media query changes
- [x] 11.4 Write unit tests for applyTheme() covering light, dark, and system modes

## Task 12: Wire QuickLauncherWindow to PromptStore

- [x] 12.1 Verify QuickLauncherWindow reads prompts from usePromptStore() (already partially wired)
- [x] 12.2 Wire prompt selection to use copyToClipboard() utility from Task 3
- [x] 12.3 Wire VariableFillModal integration in QuickLauncherWindow to use copyToClipboard() and pasteToActiveApp()
- [x] 12.4 Ensure QuickLauncherWindow hides itself after copy/paste action completes
- [x] 12.5 Write integration tests for QuickLauncherWindow prompt selection and clipboard flows

## Task 13: Add Error Boundaries

- [x] 13.1 Create src/components/ErrorBoundary.tsx React class component with error catching and fallback UI
- [x] 13.2 Wrap AppShell with ErrorBoundary in App.tsx
- [x] 13.3 Create a lightweight toast notification system (ToastStore + ToastContainer component)
- [x] 13.4 Add try/catch with toast notifications to all PromptStore action callbacks in AppShell
- [x] 13.5 Add inline error display for SettingsStore action failures in SettingsScreen
- [x] 13.6 Write tests for ErrorBoundary fallback rendering and toast notification display

## Task 14: Add Loading States

- [x] 14.1 Add loading state to App.tsx initialization (already has basic loading screen, enhance with spinner)
- [x] 14.2 Add loading state to PromptStore and display skeleton loading in library screen while prompts load
- [x] 14.3 Add loading state to SettingsStore and display placeholder content in SettingsScreen while settings load
- [x] 14.4 Display "Syncing..." indicator in SyncStatusBar when SyncService is transitioning between modes
- [x] 14.5 Write tests verifying loading states render correctly during async operations

## Task 15: Wire Sidebar Counts to Real Data

- [x] 15.1 Create sidebar count computation utility functions (computeSidebarCounts) that calculate total, favorites, recent, archived, folder, and tag counts from a prompt list
- [x] 15.2 Replace hardcoded Sidebar props (totalPromptCount, favoriteCount, recentCount, archivedCount) with computed values from PromptStore
- [x] 15.3 Remove hardcoded MOCK_TAGS and MOCK_WORKSPACES from Sidebar.tsx
- [x] 15.4 Compute tag counts dynamically from PromptStore by aggregating tags across non-archived prompts
- [ ] 15.5 Write property-based tests for sidebar count computations (Properties 2, 3, 4)
  - [x] 15.5.pbt Verify: for any list of prompts, sidebar filter counts (total, favorites, recent, archived) match expected values
  - [x] 15.5.pbt2 Verify: for any list of prompts, folder counts match grouped non-archived prompt counts
  - [x] 15.5.pbt3 Verify: for any list of prompts, tag counts match aggregated tag occurrences across non-archived prompts

## Task 16: Wire Folder and Tag Management

- [x] 16.1 Add folder creation UI (inline input) to Sidebar when "+" button is clicked in Folders section
- [x] 16.2 Wire new folder submission to persist through LocalStorageBackend and update Sidebar folder list
- [x] 16.3 Ensure PromptEditor tag additions are included in PromptStore.updatePrompt calls
- [x] 16.4 Write integration tests for folder creation and tag persistence
