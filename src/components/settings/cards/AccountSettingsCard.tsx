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
  const setUserId = useAppModeStore((s) => s.setUserId);

  return (
    <Card padding="lg">
      <AccountPanel
        authService={authService}
        mode={mode}
        userId={userId}
        syncStatus={syncStatus}
        onAuthSuccess={(user) => {
          setUserId(user.uid);
          setMode('synced');
        }}
        onSignOutSuccess={() => {
          setUserId(null);
          setMode('local');
        }}
      />
    </Card>
  );
}
