import type { ReactNode } from 'react';
import type { SettingsSectionId } from '../settings/settings-data';
import type { ConflictService } from '../../services/conflict-service';
import type { IAuthService } from '../../services/interfaces';
import type { Folder, PromptRecipe, Workspace, WorkspaceRole } from '../../types/index';

export type Screen =
  | { name: 'onboarding' }
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings'; section?: SettingsSectionId }
  | { name: 'conflicts' };

export interface AppShellSyncService {
  transitionToSynced: (
    userId: string,
    workspaceId: string,
    localPrompts: PromptRecipe[],
    migrationChoice: 'fresh',
    localFolders?: Folder[],
  ) => Promise<void>;
}

export interface AppShellProps {
  children?: ReactNode;
  authService?: IAuthService;
  syncService?: AppShellSyncService;
  conflictService?: ConflictService;
}

export interface DuplicateWorkspaceTarget {
  role: WorkspaceRole;
  workspace: Workspace;
}
