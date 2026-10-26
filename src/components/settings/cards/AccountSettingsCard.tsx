import { AccountPanel } from '../../account';
import { Card } from '../../ui/Card';
import { useAppModeStore } from '../../../stores/app-mode-store';
import type { IAuthService } from '../../../services/interfaces';

interface AccountSettingsCardProps {
  authService?: IAuthService;
}

export function AccountSettingsCard({ authService }: AccountSettingsCardProps) {
  const mode = useAppModeStore((s) => s.mode);
  const userId = useAppModeStore((s) => s.userId);
  const syncError = useAppModeStore((s) => s.syncError);
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const setMode = useAppModeStore((s) => s.setMode);
  const setSyncError = useAppModeStore((s) => s.setSyncError);
  const setSyncStatus = useAppModeStore((s) => s.setSyncStatus);
  const setUser = useAppModeStore((s) => s.setUser);
  const setUserId = useAppModeStore((s) => s.setUserId);

  return (
    <Card padding="lg">
      <AccountPanel
        authService={authService}
        mode={mode}
        userId={userId}
        syncError={syncError}
        syncStatus={syncStatus}
        onAuthSuccess={(user) => {
          setUser(user);
          setSyncError(null);
          setSyncStatus('syncing');
          setMode('synced');
        }}
        onRetrySync={() => {
          if (!userId) return;
          setSyncError(null);
          setSyncStatus('syncing');
          setMode('synced');
        }}
        onSignOutSuccess={() => {
          setUserId(null);
          setSyncError(null);
          setSyncStatus('local');
          setMode('local');
        }}
      />
    </Card>
  );
}
