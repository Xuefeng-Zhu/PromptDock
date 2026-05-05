import { Card } from '../../ui/Card';
import type { DefaultAction } from '../settings-data';
import { SettingsCardTitle } from './SettingsCardTitle';

interface DefaultBehaviorSettingsCardProps {
  canUsePasteAction: boolean;
  defaultAction: DefaultAction;
  onDefaultActionChange: (action: DefaultAction) => void | Promise<void>;
}

const DEFAULT_ACTION_OPTIONS: Array<{
  key: DefaultAction;
  label: string;
  description: string;
}> = [
  {
    key: 'copy',
    label: 'Copy to Clipboard',
    description: 'Copy the prompt text to your clipboard.',
  },
  {
    key: 'paste',
    label: 'Paste into Active App',
    description: 'Paste directly into the focused application.',
  },
];

export function DefaultBehaviorSettingsCard({
  canUsePasteAction,
  defaultAction,
  onDefaultActionChange,
}: DefaultBehaviorSettingsCardProps) {
  const options = canUsePasteAction
    ? DEFAULT_ACTION_OPTIONS
    : DEFAULT_ACTION_OPTIONS.filter((opt) => opt.key !== 'paste');
  const selectedAction = canUsePasteAction ? defaultAction : 'copy';

  return (
    <Card padding="lg">
      <SettingsCardTitle>Default Behavior</SettingsCardTitle>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-[var(--color-text-main)]">
          When selecting a prompt
        </legend>
        <div className="space-y-2">
          {options.map((opt) => {
            const isActive = selectedAction === opt.key;
            return (
              <label
                key={opt.key}
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)]',
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-gray-50',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="defaultAction"
                  value={opt.key}
                  checked={isActive}
                  onChange={() => onDefaultActionChange(opt.key)}
                  className="mt-0.5"
                />
                <div>
                  <span className="block text-sm font-medium text-[var(--color-text-main)]">
                    {opt.label}
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {opt.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}
