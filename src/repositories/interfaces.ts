import type {
  AuthUser,
  Folder,
  PromptRecipe,
  UserSettings,
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';

// ─── Storage Backend Interface ─────────────────────────────────────────────────

/**
 * Abstraction over the persistence layer. Implemented by:
 * - `LocalStorageBackend` (Tauri Store plugin — desktop)
 * - `BrowserStorageBackend` (window.localStorage — browser)
 */
export interface IStorageBackend {
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

// ─── Repository Interfaces ────────────────────────────────────────────────────

export interface IPromptRepository {
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

export interface IFolderRepository {
  createFolder(name: string, workspaceId: string): Promise<Folder>;
  deleteFolder(id: string, workspaceId: string): Promise<void>;
  getAllFolders(workspaceId: string): Promise<Folder[]>;
  reloadAllFolders?(workspaceId: string): Promise<Folder[]>;
}

export interface IWorkspaceRepository {
  create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;
  getById(id: string): Promise<Workspace | null>;
  listForUser(userId: string): Promise<Workspace[]>;
  listSyncedWorkspacesForUser(userId: string): Promise<Workspace[]>;
  update(id: string, changes: Partial<Workspace>): Promise<Workspace>;
  updateSyncedWorkspace(id: string, changes: Partial<Workspace>): Promise<Workspace>;
  bootstrapPersonalWorkspace(user: AuthUser): Promise<Workspace>;
  listMembershipsForUser(userId: string): Promise<WorkspaceMembership[]>;
  listPendingDomainInvitesForEmail(email: string): Promise<WorkspaceDomainInvite[]>;
  listPendingInvitesForEmail(email: string): Promise<WorkspaceInvite[]>;
  listDomainInvites(workspaceId: string): Promise<WorkspaceDomainInvite[]>;
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  listInvites(workspaceId: string): Promise<WorkspaceInvite[]>;
  createSyncedWorkspace(name: string, owner: AuthUser): Promise<{
    workspace: Workspace;
    membership: WorkspaceMembership;
  }>;
  createInvite(
    workspace: Workspace,
    email: string,
    role: WorkspaceInviteRole,
    invitedBy: string,
  ): Promise<WorkspaceInvite>;
  createDomainInvite(
    workspace: Workspace,
    domain: string,
    invitedBy: string,
  ): Promise<WorkspaceDomainInvite>;
  acceptInvite(invite: WorkspaceInvite, user: AuthUser): Promise<WorkspaceMember>;
  acceptDomainInvite(invite: WorkspaceDomainInvite, user: AuthUser): Promise<WorkspaceMember>;
  deleteSyncedWorkspace(workspaceId: string): Promise<void>;
  leaveSyncedWorkspace(workspaceId: string, userId: string): Promise<void>;
  updateMemberRole(
    workspaceId: string,
    memberUserId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember>;
  removeMember(workspaceId: string, memberUserId: string): Promise<void>;
  revokeDomainInvite(inviteId: string): Promise<void>;
  revokeInvite(inviteId: string): Promise<void>;
}

export interface ISettingsRepository {
  get(): Promise<UserSettings>;
  update(changes: Partial<UserSettings>): Promise<UserSettings>;
}
