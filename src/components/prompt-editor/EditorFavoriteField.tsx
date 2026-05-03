import { Star } from 'lucide-react';
import { Toggle } from '../ui/Toggle';

interface EditorFavoriteFieldProps {
  favorite: boolean;
  onFavoriteChange: (favorite: boolean) => void;
}

export function EditorFavoriteField({
  favorite,
  onFavoriteChange,
}: EditorFavoriteFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
        Favorite
      </label>
      <div className="flex items-center gap-2">
        <Toggle
          checked={favorite}
          onChange={onFavoriteChange}
          label=""
        />
        <Star
          className={[
            'h-5 w-5 transition-colors',
            favorite
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-[var(--color-text-placeholder)]',
          ].join(' ')}
        />
      </div>
    </div>
  );
}
