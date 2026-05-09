import { useCallback } from 'react';
import type { AppModeStore } from '../../stores/app-mode-store';
import type { AuthUser } from '../../types/index';

interface UseAppModeActionsOptions {
  setMode: AppModeStore['setMode'];
  setUserId: AppModeStore['setUserId'];
}

/**
 * Bridges auth outcomes into AppModeStore transitions.
 * The SyncService subscription in App initialization reacts to these mode
 * changes to start or stop cloud sync.
 */
export function useAppModeActions({
  setMode,
  setUserId,
}: UseAppModeActionsOptions) {
  const handleAuthSuccess = useCallback(
    (user: AuthUser) => {
      setUserId(user.uid);
      setMode('synced');
    },
    [setMode, setUserId],
  );

  const handleSignOutSuccess = useCallback(() => {
    setUserId(null);
    setMode('local');
  }, [setMode, setUserId]);

  return {
    handleAuthSuccess,
    handleSignOutSuccess,
  };
}
