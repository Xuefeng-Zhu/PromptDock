// ─── Data Models ───────────────────────────────────────────────────────────────

export interface PromptRecipe {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  body: string;
  variables?: PromptVariable[];
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
  inputType: PromptVariableInputType;
  options: string[];
}

export type PromptVariableInputType = 'text' | 'textarea' | 'dropdown';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

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
  role: WorkspaceRole;
  email: string;
  displayName: string | null;
  joinedAt: Date;
  updatedAt: Date;
  acceptedInviteId?: string;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  email: string;
  displayName: string | null;
  workspaceName: string;
  ownerId: string;
  joinedAt: Date;
  updatedAt: Date;
}

export type WorkspaceInviteStatus = 'pending' | 'accepted' | 'revoked';
export type WorkspaceInviteRole = Exclude<WorkspaceRole, 'owner'>;

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceInviteRole;
  status: WorkspaceInviteStatus;
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt: Date | null;
  acceptedBy: string | null;
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
  userEmail: string | null;
  userDisplayName: string | null;
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

export type AuthError =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'missing-configuration'
  | 'network'
  | 'popup-blocked'
  | 'popup-cancelled'
  | 'unknown';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}
