# API and Interfaces

PromptDock does not expose an HTTP API. Its important APIs are internal TypeScript interfaces, Tauri commands, Firestore document paths, and the import/export JSON format.

## Repository Interfaces

Defined in `src/repositories/interfaces.ts`.

### `IStorageBackend`

Storage backends implement this contract:

```ts
interface IStorageBackend {
  initialize(): Promise<void>;
  readPrompts(): Promise<PromptRecipe[]>;
  writePrompts(prompts: PromptRecipe[]): Promise<void>;
  readFolders(): Promise<Folder[]>;
  writeFolders(folders: Folder[]): Promise<void>;
  readSettings(): Promise<UserSettings>;
  writeSettings(settings: UserSettings): Promise<void>;
  readWorkspace(): Promise<Workspace>;
  writeWorkspace(workspace: Workspace): Promise<void>;
}
```

Implementations:

| Backend | Runtime | Storage |
|---|---|---|
| `LocalStorageBackend` | Tauri desktop | Tauri Store plugin JSON files |
| `BrowserStorageBackend` | Browser | `window.localStorage` |

### `IPromptRepository`

```ts
interface IPromptRepository {
  create(recipe: Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptRecipe>;
  getById(id: string): Promise<PromptRecipe | null>;
  getAll(workspaceId: string): Promise<PromptRecipe[]>;
  reloadAll?(workspaceId: string): Promise<PromptRecipe[]>;
  update(id: string, changes: Partial<PromptRecipe>): Promise<PromptRecipe>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  duplicate(id: string): Promise<PromptRecipe>;
  duplicateToWorkspace?(id: string, target: { workspaceId: string; createdBy: string }): Promise<PromptRecipe>;
  toggleFavorite(id: string): Promise<PromptRecipe>;
}
```

`PromptRepository` uses local/browser storage by default. In synced mode, `PromptRepository.setFirestoreDelegate()` forwards calls to `FirestoreBackend`.

### `IFolderRepository`

```ts
interface IFolderRepository {
  createFolder(name: string, workspaceId: string): Promise<Folder>;
  deleteFolder(id: string, workspaceId: string): Promise<void>;
  getAllFolders(workspaceId: string): Promise<Folder[]>;
  reloadAllFolders?(workspaceId: string): Promise<Folder[]>;
}
```

`FolderRepository` persists folders through the same `IStorageBackend` abstraction as prompts in local/browser mode. In synced mode, `FolderRepository.setFirestoreDelegate()` forwards folder operations to `FirestoreBackend`.

### `IWorkspaceRepository`

`WorkspaceRepository` exposes one local workspace in local/browser mode and synced workspace metadata in Firebase mode. Synced methods cover:

- personal workspace bootstrap
- workspace list and membership index reads
- workspace create, rename, delete, leave, and switch support through `WorkspaceStore`
- member listing, role updates, and member removal
- email invites for `editor` or `viewer` access
- exact-domain invites for reusable `viewer` access
- pending invite lookup and invite acceptance

## Service Interfaces

Defined in `src/services/interfaces.ts`.

| Interface | Responsibility |
|---|---|
| `IVariableParser` | Extract unique `{{variable}}` names in first-appearance order. |
| `IPromptRenderer` | Substitute variables or return missing variable names. |
| `ISearchEngine` | Search and rank prompts across selected fields. |
| `IImportExportService` | Export prompts, import JSON, detect duplicates. |
| `IAuthService` | Sign up, sign in, sign out, restore session, password reset, auth-state subscription. |

## Domain Models

Core models are defined in `src/types/index.ts`.

| Model | Purpose |
|---|---|
| `PromptRecipe` | Prompt title, description, body, tags, folder, favorite/archive flags, timestamps, workspace, creator, version. |
| `Folder` | Folder ID, name, timestamps. |
| `Workspace` | Workspace ID, name, owner, timestamps. |
| `WorkspaceMember` | User membership and role for a workspace. |
| `WorkspaceMembership` | Denormalized membership index used to list a user's synced workspaces. |
| `WorkspaceInvite` | Email invite for editor/viewer access to a workspace. |
| `WorkspaceDomainInvite` | Exact-domain viewer access invite for a workspace. |
| `PromptVariable` | Optional variable metadata: name, description, default value, input type, and dropdown options. |
| `UserSettings` | Hotkey, theme, default action, active workspace. |
| `PromptConflict` | Local and remote versions that require resolution. |
| `AuthUser` / `AuthResult` | Firebase Auth user and mapped auth result. |

## Tauri Commands

Defined in `src-tauri/src/commands.rs` and registered in `src-tauri/src/lib.rs`.

| Command | Arguments | Return | Behavior |
|---|---|---|---|
| `copy_to_clipboard` | `{ text: string }` | `Result<(), String>` | Writes text to system clipboard through Tauri clipboard manager. |
| `paste_to_active_app` | none | `Result<(), String>` | Waits briefly, then simulates Cmd+V on macOS or Ctrl+V elsewhere using `enigo`. |
| `register_hotkey` | `{ shortcut: string }` | `Result<(), String>` | Unregisters existing shortcuts and registers a global shortcut that toggles the quick launcher. |
| `unregister_hotkey` | none | `Result<(), String>` | Removes registered global shortcuts. |
| `toggle_quick_launcher` | none | `Result<(), String>` | Shows/focuses or hides the quick-launcher window. |
| `show_main_window` | none | `Result<(), String>` | Shows and focuses the main window. |
| `hide_main_window` | none | `Result<(), String>` | Hides the main window to tray. |

TypeScript usage example:

```ts
import { invoke } from '@tauri-apps/api/core';

await invoke('copy_to_clipboard', { text: 'Hello from PromptDock' });
await invoke('register_hotkey', { shortcut: 'CommandOrControl+Shift+P' });
```

Error handling:

- Rust commands return `Err(String)` with a human-readable message.
- TypeScript utilities catch desktop command failures where browser fallback is expected.
- `copyToClipboard()` falls back to `navigator.clipboard.writeText()` and then a temporary textarea copy path.
- `pasteToActiveApp()` copies first; if the paste command fails, the text remains on the clipboard.

## Firestore Data Model

Firestore is optional and used only in synced mode.

| Path | Access model |
|---|---|
| `/users/{userId}` | User can read/write only their own document. |
| `/settings/{userId}` | User can read/write only their own settings document. |
| `/workspaceMemberships/{workspaceId_userId}` | Signed-in users can read their own membership index rows; owners and invite acceptance flows create/update/delete rows under rule constraints. |
| `/workspaceInvites/{inviteId}` | Workspace owners create/revoke pending email invites; owners and matching invite recipients can read them; invite recipients can accept pending invites. |
| `/workspaceDomainInvites/{workspaceId_domain}` | Workspace owners manage exact-domain viewer invites; matching-domain users can read active viewer invites. |
| `/workspaces/{workspaceId}` | Workspace members can read; owners can update/delete; authenticated users can create workspaces they own. |
| `/workspaces/{workspaceId}/members/{memberId}` | Workspace members can read; owners can create/update/delete; the initial owner can create their own bootstrap membership. |
| `/workspaces/{workspaceId}/prompts/{promptId}` | Members can read; owners/editors can create/update/delete. |
| `/workspaces/{workspaceId}/prompts/{promptId}/versions/{versionId}` | Members can read; owners/editors can write. |
| `/workspaces/{workspaceId}/folders/{folderId}` | Members can read; owners/editors can write. |
| `/workspaces/{workspaceId}/conflicts/{conflictId}` | Members can read; owners/editors can write. |

Important assumption:

- The personal workspace ID is the Firebase user ID. Additional synced workspaces use generated Firestore document IDs.
- `AuthService` bootstraps `/users/{uid}`, `/workspaces/{uid}`, `/workspaces/{uid}/members/{uid}`, and `/workspaceMemberships/{uid_uid}` after email/password or Google sign-in.

## Import/Export JSON Format

Export is handled by `ImportExportService`. Archived prompts are excluded.

Example:

```json
{
  "version": "1.0",
  "exportedAt": "2026-05-01T00:00:00.000Z",
  "prompts": [
    {
      "title": "Summarize Text",
      "body": "Summarize this in {{length}} sentences:\n\n{{text}}",
      "variables": [
        {
          "name": "length",
          "description": "Summary length",
          "defaultValue": "3",
          "inputType": "text",
          "options": []
        }
      ],
      "description": "Condense long text.",
      "tags": ["summarization", "writing"],
      "folderId": null,
      "favorite": true,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

Required import fields:

| Field | Type |
|---|---|
| `version` | string |
| `exportedAt` | string |
| `prompts` | array |
| `prompts[].title` | non-empty string |
| `prompts[].body` | string |

Optional prompt fields:

- `description`
- `variables`
- `tags`
- `folderId`
- `favorite`
- `createdAt`
- `updatedAt`

Import errors return:

```ts
{ success: false, errors: string[] }
```

Successful imports return generated local `PromptRecipe` objects:

```ts
{ success: true, prompts: PromptRecipe[] }
```

Duplicate detection compares incoming prompts with existing prompts by title, body, or both.

Variable metadata is reconciled against the prompt body during import/export. Variables not present in `body` are dropped, and dropdown variables must include options with any non-empty default matching one of those options.

## Prompt Editor JSON Fill

The prompt editor also has a single-prompt "Fill From JSON" action handled by `parsePromptJson()` in `src/services/prompt-json.ts`. It accepts an object with:

- required `title` and `body`
- optional `description`, `tags`, `variables`, `folder` or `folderId`, and `favorite`

Unlike full-library import, `folder` and `folderId` must resolve to an existing folder name or ID so the editor does not create hidden folder assignments. Tags are trimmed and deduplicated case-insensitively.

## Authentication and Authorization

Authentication is Firebase email/password auth and Google sign-in through `AuthService`.

Mapped auth errors:

| Firebase condition | App error |
|---|---|
| Invalid email, user not found, wrong password, invalid credential | `invalid-credentials` |
| Email already in use | `email-in-use` |
| Weak password | `weak-password` |
| Missing Firebase env config | `missing-configuration` |
| Network request failed | `network` |
| Popup blocked | `popup-blocked` |
| Popup closed/cancelled | `popup-cancelled` |
| Anything else | `unknown` |

Authorization is enforced by Firestore rules. Local mode has no server-side authorization because data remains on the user's device.
