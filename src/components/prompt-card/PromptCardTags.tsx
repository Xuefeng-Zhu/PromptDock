import { TagPill } from '../ui';

interface PromptCardTagsProps {
  tags: string[];
  limit?: number;
  className: string;
}

export function PromptCardTags({ tags, limit, className }: PromptCardTagsProps) {
  const visibleTags = limit ? tags.slice(0, limit) : tags;
  if (visibleTags.length === 0) return null;

  return (
    <div className={className}>
      {visibleTags.map((tag) => (
        <TagPill key={tag} tag={tag} />
      ))}
    </div>
  );
}
