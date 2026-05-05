import type { ReactNode } from 'react';
import {
  Download,
  Info,
  Keyboard,
  Palette,
  Settings2,
  User,
} from 'lucide-react';
import type { UserSettings } from '../../types/index';

export type SettingsSectionId =
  | 'account-sync'
  | 'appearance'
  | 'hotkey'
  | 'default-behavior'
  | 'import-export'
  | 'about';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: ReactNode;
}

export type ThemeOption = UserSettings['theme'];
export type DefaultAction = UserSettings['defaultAction'];

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'account-sync', label: 'Account & Sync', icon: <User size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'hotkey', label: 'Hotkey', icon: <Keyboard size={18} /> },
  { id: 'default-behavior', label: 'Default Behavior', icon: <Settings2 size={18} /> },
  { id: 'import-export', label: 'Import/Export', icon: <Download size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];
