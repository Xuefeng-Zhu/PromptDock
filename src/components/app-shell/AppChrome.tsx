import { ConflictBadge } from '../../screens/ConflictCenter';
import { TopBar } from '../TopBar';
import type { IAuthService } from '../../services/interfaces';
import type { AppMode, AuthUser, SyncStatus } from '../../types/index';

interface AppChromeProps {
  authService?: IAuthService;
  mode: AppMode;
  onAuthSuccess: (user: AuthUser) => void;
  onCommandPaletteOpen: () => void;
  onConflictBadgeClick: () => void;
  onSearchChange: (query: string) => void;
  onSignOutSuccess: () => void;
  searchQuery: string;
  syncStatus?: SyncStatus;
  unresolvedConflictCount: number;
  userId: string | null;
}

export function AppChrome({
  authService,
  mode,
  onAuthSuccess,
  onCommandPaletteOpen,
  onConflictBadgeClick,
  onSearchChange,
  onSignOutSuccess,
  searchQuery,
  syncStatus,
  unresolvedConflictCount,
  userId,
}: AppChromeProps) {
  return (
    <>
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCommandPaletteOpen={onCommandPaletteOpen}
        authService={authService}
        mode={mode}
        userId={userId}
        onAuthSuccess={onAuthSuccess}
        onSignOutSuccess={onSignOutSuccess}
        syncStatus={syncStatus}
      />

      {unresolvedConflictCount > 0 && (
        <div className="fixed top-0 right-32 z-50 flex h-14 items-center">
          <ConflictBadge
            count={unresolvedConflictCount}
            onClick={onConflictBadgeClick}
          />
        </div>
      )}
    </>
  );
}
