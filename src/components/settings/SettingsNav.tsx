import type { SettingsNavItem, SettingsSectionId } from './settings-data';

interface SettingsNavProps {
  activeSection: SettingsSectionId;
  items: SettingsNavItem[];
  onSelectSection: (id: SettingsSectionId) => void;
}

export function SettingsNav({
  activeSection,
  items,
  onSelectSection,
}: SettingsNavProps) {
  return (
    <nav
      className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] p-4"
      aria-label="Settings navigation"
    >
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-selected={isActive}
                className={[
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                  isActive
                    ? 'bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)]',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
