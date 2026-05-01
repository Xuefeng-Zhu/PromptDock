# Broken Buttons Fix — Tasks

## Task 1: Wire PromptInspector action callbacks

- [x] 1.1 Extend `PromptInspectorProps` in `src/components/PromptInspector.tsx` to add optional callback props: `onToggleFavorite?: (id: string) => void`, `onEdit?: (id: string) => void`, `onDuplicate?: (id: string) => void`, `onArchive?: (id: string) => void`, `onDelete?: (id: string) => void`, `onCopyBody?: (body: string) => void`
- [x] 1.2 Wire the favorite star button `onClick` to call `onToggleFavorite?.(prompt.id)`
- [x] 1.3 Wire the "Copy prompt body" button `onClick` to call `onCopyBody?.(prompt.body)`
- [x] 1.4 Wire each dropdown menu item to call its corresponding callback AND close the menu: "Edit prompt" → `onEdit`, "Duplicate" → `onDuplicate`, "Archive" → `onArchive`, "Delete" → `onDelete`
- [x] 1.5 Write unit tests in `src/components/__tests__/PromptInspector.test.tsx` verifying each button calls its callback with the correct argument and that the dropdown closes after each action

## Task 2: Wire PromptEditor edit-mode action buttons

- [x] 2.1 Extend `PromptEditorProps` in `src/components/PromptEditor.tsx` to add optional callback props: `onDuplicate?: () => void`, `onArchive?: () => void`, `onCopy?: () => void`
- [x] 2.2 Wire the Duplicate button `onClick` to call `onDuplicate?.()`
- [x] 2.3 Wire the Archive button `onClick` to call `onArchive?.()`
- [x] 2.4 Wire the Copy button `onClick` to call `onCopy?.()`
- [x] 2.5 Write unit tests in `src/components/__tests__/PromptEditor.test.tsx` verifying each edit-mode action button calls its callback when clicked

## Task 3: Wire TopBar Sync/Refresh button

- [x] 3.1 Extend `TopBarProps` in `src/components/TopBar.tsx` to add optional `onSync?: () => void` callback prop
- [x] 3.2 Wire the Sync/Refresh button `onClick` to call `onSync?.()`
- [x] 3.3 Write unit tests in `src/components/__tests__/TopBar.test.tsx` verifying the Sync button calls `onSync` when clicked

## Task 4: Thread callbacks through AppShell

- [x] 4.1 Create `handleDeletePrompt` callback in AppShell that calls `deletePrompt(id)` from the store with error toast handling and deselects the prompt if it was selected
- [x] 4.2 Create `handleEditPrompt` callback in AppShell that navigates to the editor screen with `setScreen({ name: 'editor', promptId: id })`
- [x] 4.3 Create `handleCopyPromptBody` callback in AppShell that calls `copyToClipboard(body)` and shows a success toast via `addToast`
- [x] 4.4 Create `handleSync` callback in AppShell that calls `loadPrompts()` from the store with error toast handling
- [x] 4.5 Pass all callbacks to `<PromptInspector>`: `onToggleFavorite={handleToggleFavorite}`, `onEdit={handleEditPrompt}`, `onDuplicate={handleDuplicatePrompt}`, `onArchive={handleArchivePrompt}`, `onDelete={handleDeletePrompt}`, `onCopyBody={handleCopyPromptBody}`
- [x] 4.6 Pass callbacks to `<PromptEditor>`: `onDuplicate`, `onArchive`, `onCopy` — create wrappers that use the current `screen.promptId` and navigate back to library after the action
- [x] 4.7 Pass `onSync={handleSync}` to `<TopBar>`
- [x] 4.8 Write integration tests in `src/components/__tests__/AppShell.test.tsx` verifying that clicking action buttons in PromptInspector triggers the correct store actions

## Task 5: Wire lower-priority stub buttons

- [x] 5.1 Wire the "Filters" button in `LibraryScreen.tsx` — add an `onFiltersClick` optional prop and pass it from AppShell (can show a toast placeholder: "Advanced filters coming soon")
- [x] 5.2 Wire the "New Prompt" ChevronDown in `LibraryScreen.tsx` — add an `onNewPromptOptions` optional prop and pass it from AppShell (can show a toast placeholder or a dropdown with "Import from JSON")
- [x] 5.3 Wire the "More…" buttons in `Sidebar.tsx` — add `onMoreFolders` and `onMoreTags` optional props and pass them from AppShell (can show toast placeholders)
- [x] 5.4 Wire the Save options ChevronDown in `PromptEditor.tsx` — add local state for a save options dropdown with "Save and Close" option that calls `onSave`

## Task 6: Verify preservation of existing behavior

- [x] 6.1 Run the existing test suite (`npm test`) and verify all existing tests pass with the changes from Tasks 1–5
- [x] 6.2 Manually verify that Save, Cancel, New Prompt, filter chips, prompt card selection, sidebar navigation, settings, search, dropdown toggle, and grid/list toggle all continue to work correctly
