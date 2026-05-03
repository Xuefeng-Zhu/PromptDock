import type { PromptRecipe } from '../../types/index';
import { formatDate, formatRelativeShort } from '../../utils/date-format';

interface PromptMetadataFooterProps {
  prompt: PromptRecipe;
}

export function PromptMetadataFooter({ prompt }: PromptMetadataFooterProps) {
  return (
    <div className="mt-6 flex items-center gap-8 text-xs text-[var(--color-text-muted)]">
      <span>Created {formatDate(prompt.createdAt)}</span>
      <span>Updated {formatDate(prompt.updatedAt)}</span>
      <span className="ml-auto">Last used {formatRelativeShort(prompt.lastUsedAt)}</span>
    </div>
  );
}
