import { TagPill } from '../ui';

interface PromptCardTagsProps {
  tags: string[];
  limit?: number;
  className: string;
}

export function PromptCardTags({ tags, limit, className }: PromptCardTagsProps) {
  const visibleTags = limit ? tags.slice(0, limit) : tags;
  const remainingCount = limit ? Math.max(0, tags.length - limit) : 0;
  if (visibleTags.length === 0) return null;

  return (
    <div className={className}>
      {visibleTags.map((tag) => (
        <TagPill key={tag} tag={tag} />
      ))}
      {remainingCount > 0 && <TagPill tag={`+${remainingCount}`} />}
    </div>
  );
}
