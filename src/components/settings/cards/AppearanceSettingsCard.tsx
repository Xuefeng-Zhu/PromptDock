import type { ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { ThemeOption } from '../settings-data';
import { SettingsCardTitle } from './SettingsCardTitle';
import { SettingsOptionLabel } from './SettingsOptionLabel';

interface AppearanceSettingsCardProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void | Promise<void>;
}

interface ThemeItem {
  key: ThemeOption;
  icon: ReactNode;
  label: string;
}

const THEME_OPTIONS: ThemeItem[] = [
  { key: 'light', icon: <Sun size={20} />, label: 'Light' },
  { key: 'dark', icon: <Moon size={20} />, label: 'Dark' },
  { key: 'system', icon: <Monitor size={20} />, label: 'System' },
];

export function AppearanceSettingsCard({
  theme,
  onThemeChange,
}: AppearanceSettingsCardProps) {
  return (
    <Card padding="lg">
      <SettingsCardTitle>Appearance</SettingsCardTitle>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--color-text-main)]">
          Theme
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const isActive = theme === option.key;
            return (
              <SettingsOptionLabel
                key={option.key}
                active={isActive}
                className="flex-col items-center gap-2 p-4"
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.key}
                  checked={isActive}
                  onChange={() => onThemeChange(option.key)}
                  className="sr-only"
                />
                <span
                  className={
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {option.icon}
                </span>
                <span
                  className={[
                    'text-xs font-medium',
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-main)]',
                  ].join(' ')}
                >
                  {option.label}
                </span>
              </SettingsOptionLabel>
            );
          })}
        </div>
      </fieldset>

    </Card>
  );
}
