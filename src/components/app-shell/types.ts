import type { ReactNode } from 'react';
import type { ConflictService } from '../../services/conflict-service';
import type { IAuthService } from '../../services/interfaces';

export type Screen =
  | { name: 'onboarding' }
  | { name: 'library' }
  | { name: 'editor'; promptId?: string }
  | { name: 'settings' }
  | { name: 'conflicts' };

export interface AppShellSyncService {
  transitionToSynced: (
    userId: string,
    workspaceId: string,
    localPrompts: never[],
    migrationChoice: 'fresh',
  ) => Promise<void>;
}

export interface AppShellProps {
  children?: ReactNode;
  authService?: IAuthService;
  syncService?: AppShellSyncService;
  conflictService?: ConflictService;
}
