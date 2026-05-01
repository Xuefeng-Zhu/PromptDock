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
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  duplicate(id: string): Promise<PromptRecipe>;
  toggleFavorite(id: string): Promise<PromptRecipe>;
}
```

`PromptRepository` uses local/browser storage by default. In synced mode, `PromptRepository.setFirestoreDelegate()` forwards calls to `FirestoreBackend`.

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
| `/workspaces/{workspaceId}` | Workspace members can read; owners can update/delete; authenticated users can create. |
| `/workspaces/{workspaceId}/members/{memberId}` | Workspace members can read; owners can create/update/delete. |
| `/workspaces/{workspaceId}/prompts/{promptId}` | Members can read; owners/editors can create/update/delete. |
| `/workspaces/{workspaceId}/prompts/{promptId}/versions/{versionId}` | Members can read; owners/editors can write. |
| `/workspaces/{workspaceId}/folders/{folderId}` | Members can read; owners/editors can write. |
| `/workspaces/{workspaceId}/conflicts/{conflictId}` | Members can read; owners/editors can write. |

Important assumption:

- The default workspace ID is currently treated as the Firebase user ID in `src/App.tsx`.

TODO:

- Bootstrap `/workspaces/{workspaceId}` and `/workspaces/{workspaceId}/members/{uid}` after signup/signin. See [Deferred Issues](Issues.md).

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

## Authentication and Authorization

Authentication is Firebase email/password auth through `AuthService`.

Mapped auth errors:

| Firebase condition | App error |
|---|---|
| Invalid email, user not found, wrong password, invalid credential | `invalid-credentials` |
| Email already in use | `email-in-use` |
| Weak password | `weak-password` |
| Anything else | `unknown` |

Authorization is enforced by Firestore rules. Local mode has no server-side authorization because data remains on the user's device.
