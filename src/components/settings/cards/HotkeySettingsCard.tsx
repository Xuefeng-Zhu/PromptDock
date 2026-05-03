import { Card } from '../../ui/Card';
import { HotkeyRecorder } from '../../ui/HotkeyRecorder';
import { SettingsCardTitle } from './SettingsCardTitle';

interface HotkeySettingsCardProps {
  hotkey: string;
  onHotkeyChange: (hotkey: string) => boolean | Promise<boolean>;
  error?: string | null;
}

export function HotkeySettingsCard({
  hotkey,
  onHotkeyChange,
  error,
}: HotkeySettingsCardProps) {
  return (
    <Card padding="lg">
      <SettingsCardTitle>Hotkey</SettingsCardTitle>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        Set the global shortcut that opens PromptDock from anywhere.
      </p>
      <HotkeyRecorder
        value={hotkey}
        onChange={onHotkeyChange}
        error={error}
        ariaLabel="Global hotkey combination"
      />
    </Card>
  );
}
