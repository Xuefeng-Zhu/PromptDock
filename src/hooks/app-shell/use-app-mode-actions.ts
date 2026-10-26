import { useCallback } from 'react';
import type { AppModeStore } from '../../stores/app-mode-store';
import type { AuthUser } from '../../types/index';

interface UseAppModeActionsOptions {
  setMode: AppModeStore['setMode'];
  setSyncError: AppModeStore['setSyncError'];
  setSyncStatus: AppModeStore['setSyncStatus'];
  setUser: AppModeStore['setUser'];
  setUserId: AppModeStore['setUserId'];
  userId: string | null;
}

/**
 * Bridges auth outcomes into AppModeStore transitions.
 * The SyncService subscription in App initialization reacts to these mode
 * changes to start or stop cloud sync.
 */
export function useAppModeActions({
  setMode,
  setSyncError,
  setSyncStatus,
  setUser,
  setUserId,
  userId,
}: UseAppModeActionsOptions) {
  const handleAuthSuccess = useCallback(
    (user: AuthUser) => {
      setUser(user);
      setSyncError(null);
      setSyncStatus('syncing');
      setMode('synced');
    },
    [setMode, setSyncError, setSyncStatus, setUser],
  );

  const handleSignOutSuccess = useCallback(() => {
    setUserId(null);
    setSyncError(null);
    setSyncStatus('local');
    setMode('local');
  }, [setMode, setSyncError, setSyncStatus, setUserId]);

  const handleRetrySync = useCallback(() => {
    if (!userId) return;
    setSyncError(null);
    setSyncStatus('syncing');
    setMode('synced');
  }, [setMode, setSyncError, setSyncStatus, userId]);

  return {
    handleAuthSuccess,
    handleRetrySync,
    handleSignOutSuccess,
  };
}
