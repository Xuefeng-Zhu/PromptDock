import { formatRelativeTime } from '../../utils/date-format';
import { PromptCardFavoriteButton } from './PromptCardFavoriteButton';

interface PromptCardFooterProps {
  favorite: boolean;
  isList: boolean;
  lastUsedAt: Date | null;
  onToggleFavorite: () => void;
}

export function PromptCardFooter({
  favorite,
  isList,
  lastUsedAt,
  onToggleFavorite,
}: PromptCardFooterProps) {
  return (
    <div
      className={
        isList
          ? 'ml-auto flex shrink-0 items-center gap-3'
          : 'mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2'
      }
    >
      <span className="text-[11px] text-[var(--color-text-placeholder)]">
        {formatRelativeTime(lastUsedAt)}
      </span>
      <PromptCardFavoriteButton
        favorite={favorite}
        onClick={onToggleFavorite}
      />
    </div>
  );
}
