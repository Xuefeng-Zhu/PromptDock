import { Card } from '../../ui/Card';
import { SettingsCardTitle } from './SettingsCardTitle';

export function AboutSettingsCard() {
  return (
    <Card padding="lg">
      <SettingsCardTitle>About</SettingsCardTitle>
      <div className="space-y-2 text-sm text-[var(--color-text-main)]">
        <p>
          <span className="font-medium">PromptDock</span>{' '}
          <span className="text-[var(--color-text-muted)]">v0.2.0</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          A desktop prompt recipe manager built with Tauri, React, and TypeScript.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} PromptDock. All rights reserved.
        </p>
      </div>
    </Card>
  );
}
