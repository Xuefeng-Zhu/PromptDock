type PromptResultTagVariant = 'palette' | 'launcher';

interface PromptResultTagsProps {
  tags: string[];
  variant: PromptResultTagVariant;
}

export function PromptResultTags({ tags, variant }: PromptResultTagsProps) {
  if (tags.length === 0) return null;

  if (variant === 'launcher') {
    return (
      <div className="mt-1 flex gap-1">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full px-1.5 py-0.5 text-[10px]"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-text-muted)',
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
