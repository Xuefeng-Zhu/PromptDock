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
  createdBy: string;
  version: number;
}

export interface PromptVariable {
  name: string;
  defaultValue: string;
  description: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
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
  hotkeyCombo: string;
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

export type AppMode = 'local' | 'synced' | 'offline-synced';

export type SyncStatus = 'local' | 'synced' | 'syncing' | 'offline' | 'pending-changes';

export type RenderResult =
  | { success: true; text: string }
  | { success: false; missingVariables: string[] };

export type ImportResult =
  | { success: true; prompts: PromptRecipe[] }
  | { success: false; errors: string[] };

export interface DuplicateInfo {
  incoming: PromptRecipe;
  existing: PromptRecipe;
  matchedOn: 'title' | 'body' | 'both';
}

export type AuthResult =
  | { success: true; user: AuthUser }
  | { success: false; error: AuthError };

export type AuthError = 'invalid-credentials' | 'email-in-use' | 'weak-password' | 'unknown';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}

export interface AppModeState {
  mode: AppMode;
  userId: string | null;
  isOnline: boolean;
}
