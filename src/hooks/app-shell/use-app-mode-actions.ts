import { useCallback } from 'react';
import type { AppModeStore } from '../../stores/app-mode-store';
import type { AuthUser } from '../../types/index';

interface UseAppModeActionsOptions {
  setMode: AppModeStore['setMode'];
  setSyncStatus: AppModeStore['setSyncStatus'];
  setUser: AppModeStore['setUser'];
  setUserId: AppModeStore['setUserId'];
}

/**
 * Bridges auth outcomes into AppModeStore transitions.
 * The SyncService subscription in App initialization reacts to these mode
 * changes to start or stop cloud sync.
 */
export function useAppModeActions({
  setMode,
  setSyncStatus,
  setUser,
  setUserId,
}: UseAppModeActionsOptions) {
  const handleAuthSuccess = useCallback(
    (user: AuthUser) => {
      setUser(user);
      setSyncStatus('syncing');
      setMode('synced');
    },
    [setMode, setSyncStatus, setUser],
  );

  const handleSignOutSuccess = useCallback(() => {
    setUserId(null);
    setSyncStatus('local');
    setMode('local');
  }, [setMode, setSyncStatus, setUserId]);

  return {
    handleAuthSuccess,
    handleSignOutSuccess,
  };
}
