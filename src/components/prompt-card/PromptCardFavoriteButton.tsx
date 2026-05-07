import { Star } from 'lucide-react';

interface PromptCardFavoriteButtonProps {
  favorite: boolean;
  onClick: () => void;
}

export function PromptCardFavoriteButton({
  favorite,
  onClick,
}: PromptCardFavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-gray-100 sm:h-auto sm:w-auto sm:p-0.5"
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={[
          'h-4 w-4 transition-colors',
          favorite
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-[var(--color-text-placeholder)]',
        ].join(' ')}
      />
    </button>
  );
}
