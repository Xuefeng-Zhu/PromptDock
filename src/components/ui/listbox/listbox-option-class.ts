type ListboxOptionLayout = 'block' | 'flex';
type ListboxOptionSize = 'compact' | 'standard';

const LISTBOX_OPTION_LAYOUT_CLASS: Record<ListboxOptionLayout, string> = {
  block: 'block w-full',
  flex: 'flex w-full items-center gap-2',
};

const LISTBOX_OPTION_SIZE_CLASS: Record<ListboxOptionSize, string> = {
  compact: 'px-2 py-1.5 text-xs',
  standard: 'px-2 py-2 text-sm',
};

export function getListboxOptionClass({
  active,
  className = '',
  layout = 'flex',
  size = 'standard',
}: {
  active: boolean;
  className?: string;
  layout?: ListboxOptionLayout;
  size?: ListboxOptionSize;
}) {
  return [
    LISTBOX_OPTION_LAYOUT_CLASS[layout],
    'rounded-md text-left transition-colors',
    LISTBOX_OPTION_SIZE_CLASS[size],
    active
      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
      : 'text-[var(--color-text-main)] hover:bg-gray-50',
    className,
  ].filter(Boolean).join(' ');
}
