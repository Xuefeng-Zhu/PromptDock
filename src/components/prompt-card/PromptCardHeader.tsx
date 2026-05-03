import type { ReactNode } from 'react';
import type { PromptRecipe } from '../../types/index';
import { IconTile } from '../IconTile';
import { PromptCardTags } from './PromptCardTags';
import { truncate } from './text';

interface PromptCardHeaderProps {
  categoryColor: string;
  icon: ReactNode;
  isList: boolean;
  prompt: PromptRecipe;
}

export function PromptCardHeader({
  categoryColor,
  icon,
  isList,
  prompt,
}: PromptCardHeaderProps) {
  return (
    <div className={isList ? 'flex min-w-0 flex-1 items-start gap-3' : 'flex items-start gap-3'}>
      <IconTile icon={icon} color={categoryColor} />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)] leading-snug truncate">
          {prompt.title}
        </h3>

        {prompt.description && (
          <p
            className={[
              'mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed',
              isList ? 'truncate' : 'line-clamp-2',
            ].join(' ')}
          >
            {truncate(prompt.description, 120)}
          </p>
        )}

        {isList && (
          <PromptCardTags
            tags={prompt.tags}
            limit={4}
            className="mt-2 flex flex-wrap gap-1.5"
          />
        )}
      </div>
    </div>
  );
}
