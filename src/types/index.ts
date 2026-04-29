// ─── Data Models ───────────────────────────────────────────────────────────────

export interface PromptRecipe {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  folderId: string | null;
  favorite: boolean;
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  createdBy: string; // 'local' in Local Mode, userId in Synced Mode
  version: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  defaultValue: string;
  description: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string; // 'local' in Local Mode
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface UserSettings {
  hotkeyCombo: string; // e.g. 'CommandOrControl+Shift+P'
  theme: 'light' | 'dark' | 'system';
  defaultAction: 'copy' | 'paste';
  activeWorkspaceId: string;
}

export interface PromptConflict {
  id: string;
  promptId: string;
  localVersion: PromptRecipe;
  remoteVersion: PromptRecipe;
  detectedAt: Date;
  resolvedAt: Date | null;
}

// ─── Application Mode ──────────────────────────────────────────────────────────

export type AppMode = 'local' | 'synced' | 'offline-synced';

export interface AppModeState {
  mode: AppMode;
  userId: string | null;
  isOnline: boolean;
}

// ─── Sync Status ───────────────────────────────────────────────────────────────

export type SyncStatus = 'local' | 'synced' | 'syncing' | 'offline' | 'pending-changes';

// ─── Prompt Renderer ───────────────────────────────────────────────────────────

export type RenderResult =
  | { success: true; text: string }
  | { success: false; missingVariables: string[] };

// ─── Import/Export ─────────────────────────────────────────────────────────────

export type ImportResult =
  | { success: true; prompts: PromptRecipe[] }
  | { success: false; errors: string[] };

export interface DuplicateInfo {
  incoming: PromptRecipe;
  existing: PromptRecipe;
  matchedOn: 'title' | 'body' | 'both';
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: AuthError };

export type AuthError = 'invalid-credentials' | 'email-in-use' | 'weak-password' | 'unknown';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}
