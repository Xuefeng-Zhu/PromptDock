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
  const syncStatus = useAppModeStore((s) => s.syncStatus);
  const setMode = useAppModeStore((s) => s.setMode);
  const setSyncStatus = useAppModeStore((s) => s.setSyncStatus);
  const setUser = useAppModeStore((s) => s.setUser);
  const setUserId = useAppModeStore((s) => s.setUserId);

  return (
    <Card padding="lg">
      <AccountPanel
        authService={authService}
        mode={mode}
        userId={userId}
        syncStatus={syncStatus}
        onAuthSuccess={(user) => {
          setUser(user);
          setSyncStatus('syncing');
          setMode('synced');
        }}
        onSignOutSuccess={() => {
          setUserId(null);
          setSyncStatus('local');
          setMode('local');
        }}
      />
    </Card>
  );
}
